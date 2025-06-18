export default interface CapitulosModels {
    id:  number;
    titulo: string;
    status: 'disponivel' | 'gravando'| "gravacaoconcluida";
    narradorId: string | null;
}

