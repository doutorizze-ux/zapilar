// Em produção, forçamos o uso do proxy reverso (/api) para evitar CORS e problemas de Mixed Content.
// Em desenvolvimento, usamos localhost ou a variável de ambiente.
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '/api');
