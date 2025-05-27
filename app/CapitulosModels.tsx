export default interface CapitulosModels {
    id:  number;
    titulo: string;
    status: 'ok' | 'gravando'| "gravacaoConcluida";
    narradorId: string | null;
}

