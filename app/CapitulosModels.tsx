export default interface CapitulosModels {
    id:  number;
    titulo: string;
    status: 'ok' | 'gravando';
    narradorId: string | null;
}

