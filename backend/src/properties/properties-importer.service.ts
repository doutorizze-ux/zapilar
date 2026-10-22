import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Property, PropertyType } from './entities/property.entity';

@Injectable()
export class PropertiesImporterService {
  private readonly logger = new Logger(PropertiesImporterService.name);

  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  /**
   * Importa imóveis diretamente a partir da URL do Feed XML (Padrão VivaReal, ZAP, Kenlo, Vista)
   */
  async importFromUrl(userId: string, url: string): Promise<{ total: number; message: string }> {
    if (!url || !url.startsWith('http')) {
      throw new BadRequestException('URL do Feed XML inválida. Forneça uma URL http(s) completa.');
    }

    this.logger.log(`Fetching XML feed from: ${url} for user ${userId}`);
    const response = await axios.get(url, {
      timeout: 45000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ZapilarImporter/2.0; +https://zapilar.online)',
      },
      responseType: 'text',
    });

    const xmlText = response.data;
    if (typeof xmlText !== 'string' || !xmlText.includes('<')) {
      throw new BadRequestException('O conteúdo retornado pela URL não é um XML válido.');
    }

    return this.importFromXml(userId, xmlText);
  }

  /**
   * Importa imóveis a partir do conteúdo de um arquivo XML
   */
  async importFromXml(userId: string, xmlText: string): Promise<{ total: number; message: string }> {
    const propertyBlocks = this.extractBlocks(xmlText, ['Imovel', 'imovel', 'Property', 'property', 'Listing']);
    if (propertyBlocks.length === 0) {
      throw new BadRequestException('Nenhum bloco de imóvel (<Imovel> ou <Property>) foi encontrado no XML.');
    }

    this.logger.log(`Found ${propertyBlocks.length} properties in XML feed for user ${userId}`);
    let imported = 0;

    for (const block of propertyBlocks) {
      try {
        const prop = this.parsePropertyBlock(block, userId);
        if (prop && prop.price > 0) {
          await this.propertyRepository.save(prop);
          imported++;
        }
      } catch (err: any) {
        this.logger.warn(`Failed to parse a property block: ${err?.message || err}`);
      }
    }

    return {
      total: imported,
      message: `Sucesso! ${imported} imóveis foram importados e sincronizados para o seu estoque Zapilar.`,
    };
  }

  /**
   * Importa a partir de CSV / Planilha exportada
   */
  async importFromCsv(userId: string, csvContent: string): Promise<{ total: number; message: string }> {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new BadRequestException('O arquivo CSV deve conter um cabeçalho e pelo menos 1 linha de dados.');
    }

    const separator = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(separator).map((h) => h.trim().toLowerCase());

    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(separator).map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 3) continue;

      const getVal = (colNames: string[]) => {
        for (const name of colNames) {
          const idx = headers.indexOf(name);
          if (idx !== -1 && cols[idx]) return cols[idx];
        }
        return '';
      };

      const title = getVal(['titulo', 'title', 'nome', 'imovel']) || 'Imóvel em Goiás';
      const typeStr = getVal(['tipo', 'type', 'categoria']) || 'Casa';
      const priceRaw = getVal(['preco', 'price', 'valor', 'preco_venda']);
      const cleanPrice = parseFloat(priceRaw.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;
      if (cleanPrice <= 0) continue;

      const city = getVal(['cidade', 'city', 'municipio']) || 'Goiânia';
      const neighborhood = getVal(['bairro', 'neighborhood', 'setor']) || 'Setor Bueno';
      const area = parseFloat(getVal(['area', 'area_util', 'm2'])) || 100;
      const areaUnit = getVal(['unidade_area', 'unidade']) || (area < 20 && title.toLowerCase().includes('fazenda') ? 'alqueire' : 'm2');
      const bedrooms = parseInt(getVal(['quartos', 'dormitorios', 'bedrooms'])) || 0;
      const bathrooms = parseInt(getVal(['banheiros', 'suites', 'bathrooms'])) || 0;
      const parkingSpaces = parseInt(getVal(['vagas', 'garagem', 'parking'])) || 0;
      const description = getVal(['descricao', 'description', 'observacao', 'obs']) || title;
      const acceptsTrade = ['sim', 'true', '1', 'aceita'].includes(getVal(['permuta', 'aceita_permuta', 'troca']).toLowerCase());
      const imagesStr = getVal(['fotos', 'images', 'foto_principal']);
      const images = imagesStr ? imagesStr.split('|').map((img) => img.trim()).filter(Boolean) : [];

      const prop = this.propertyRepository.create({
        userId,
        title,
        type: this.mapPropertyType(typeStr),
        price: cleanPrice,
        city,
        neighborhood,
        location: `${neighborhood}, ${city}`,
        area,
        areaUnit,
        bedrooms,
        bathrooms,
        parkingSpaces,
        description,
        images,
        acceptsTrade,
        pool: description.toLowerCase().includes('piscina'),
        isGatedCommunity: description.toLowerCase().includes('condomínio') || description.toLowerCase().includes('jardins'),
      });

      await this.propertyRepository.save(prop);
      imported++;
    }

    return {
      total: imported,
      message: `Sucesso! ${imported} imóveis importados via planilha com sucesso.`,
    };
  }

  // --- Helper Methods ---

  private extractBlocks(xml: string, tagNames: string[]): string[] {
    for (const tag of tagNames) {
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
      const matches: string[] = [];
      let match;
      while ((match = regex.exec(xml)) !== null) {
        matches.push(match[1]);
      }
      if (matches.length > 0) return matches;
    }
    return [];
  }

  private getTagValue(block: string, tags: string[]): string {
    for (const tag of tags) {
      const regex = new RegExp(`<${tag}[^>]*>(<!\\[CDATA\\[)?([\\s\\S]*?)(\\]\\]>)?<\\/${tag}>`, 'i');
      const match = block.match(regex);
      if (match && match[2]) {
        return match[2].trim();
      }
    }
    return '';
  }

  private extractImages(block: string): string[] {
    const urls: string[] = [];
    const urlRegex = /<URLArquivo[^>]*>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/URLArquivo>|<URL[^>]*>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/URL>|<Item[^>]*>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/Item>/gi;
    let match;
    while ((match = urlRegex.exec(block)) !== null) {
      const url = (match[2] || match[5] || match[8] || '').trim();
      if (url.startsWith('http')) {
        urls.push(url);
      }
    }
    return Array.from(new Set(urls)).slice(0, 8); // Atribui até 8 fotos principais
  }

  private parsePropertyBlock(block: string, userId: string): Property {
    const typeRaw = this.getTagValue(block, ['TipoImovel', 'Tipo', 'PropertyType', 'Categoria']);
    const type = this.mapPropertyType(typeRaw);

    const priceRaw = this.getTagValue(block, ['PrecoVenda', 'Preco', 'ValorVenda', 'Price', 'Valor']);
    const cleanPrice = parseFloat(priceRaw.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;

    const city = this.getTagValue(block, ['Cidade', 'City', 'Municipio']) || 'Goiânia';
    const neighborhood = this.getTagValue(block, ['Bairro', 'Neighborhood', 'Setor']) || 'Setor Bueno';
    const address = this.getTagValue(block, ['Endereco', 'Logradouro', 'Address']);
    const cep = this.getTagValue(block, ['CEP', 'PostalCode']);

    let title = this.getTagValue(block, ['TituloImovel', 'Titulo', 'Title', 'Nome']);
    if (!title) {
      title = `${type} no ${neighborhood} - ${city}`;
    }

    const description = this.getTagValue(block, ['Observacao', 'Descricao', 'Description', 'Detalhes']) || title;
    const area = parseFloat(this.getTagValue(block, ['AreaUtil', 'AreaPrivativa', 'AreaTotal', 'AreaConstruida', 'Area'])) || 80;
    const bedrooms = parseInt(this.getTagValue(block, ['QtdDormitorios', 'Quartos', 'Dormitorios', 'Bedrooms'])) || 0;
    const bathrooms = parseInt(this.getTagValue(block, ['QtdBanheiros', 'Banheiros', 'Suites', 'Bathrooms'])) || 0;
    const parkingSpaces = parseInt(this.getTagValue(block, ['QtdVagas', 'Vagas', 'Garagens', 'ParkingSpaces'])) || 0;

    const images = this.extractImages(block);

    const lowerDesc = description.toLowerCase();
    const acceptsTrade =
      ['1', 'sim', 'true'].includes(this.getTagValue(block, ['AceitaPermuta', 'Permuta']).toLowerCase()) ||
      lowerDesc.includes('permuta') ||
      lowerDesc.includes('troca') ||
      lowerDesc.includes('veículo') ||
      lowerDesc.includes('hilux');

    const isGatedCommunity =
      lowerDesc.includes('condomínio') ||
      lowerDesc.includes('jardins') ||
      lowerDesc.includes('alphaville') ||
      lowerDesc.includes('aldeia do vale');

    const isRural = type === PropertyType.FARM || type === PropertyType.CHACARA;
    const areaUnit = isRural && (lowerDesc.includes('alqueire') || area < 50) ? 'alqueire' : 'm2';

    return this.propertyRepository.create({
      userId,
      title,
      type,
      price: cleanPrice,
      city,
      neighborhood,
      address,
      cep,
      location: `${neighborhood}, ${city}`,
      area,
      areaUnit,
      bedrooms,
      bathrooms,
      parkingSpaces,
      description,
      images,
      pool: this.getTagValue(block, ['Piscina', 'Pool']) === '1' || lowerDesc.includes('piscina'),
      security: this.getTagValue(block, ['Portaria24Horas', 'Seguranca']) === '1' || lowerDesc.includes('portaria') || lowerDesc.includes('segurança 24h'),
      elevator: this.getTagValue(block, ['Elevador', 'Elevator']) === '1' || lowerDesc.includes('elevador'),
      furnished: this.getTagValue(block, ['Mobiliado', 'Furnished']) === '1' || lowerDesc.includes('mobiliado'),
      acceptsTrade,
      isGatedCommunity,
      directFinancing: lowerDesc.includes('financiamento direto') || lowerDesc.includes('balões'),
    });
  }

  private mapPropertyType(raw: string): PropertyType {
    const lower = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lower.includes('apartamento') || lower.includes('apto') || lower.includes('flat') || lower.includes('studio') || lower.includes('cobertura')) {
      return PropertyType.APARTMENT;
    }
    if (lower.includes('casa') || lower.includes('sobrado')) {
      return PropertyType.HOUSE;
    }
    if (lower.includes('lote') || lower.includes('lot')) {
      return PropertyType.LOT;
    }
    if (lower.includes('terreno')) {
      return PropertyType.LAND;
    }
    if (lower.includes('fazenda')) {
      return PropertyType.FARM;
    }
    if (lower.includes('chacara') || lower.includes('sitio')) {
      return PropertyType.CHACARA;
    }
    if (lower.includes('comercial') || lower.includes('sala') || lower.includes('galpao')) {
      return PropertyType.COMMERCIAL;
    }
    return PropertyType.HOUSE;
  }
}
