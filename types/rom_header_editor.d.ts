export interface FixedLengthString {
    length:number;
    pad:string;
    str:string;
    constructor(length:number, initial:string, pad:string);
    emit(): string;
    charCodeAt(i: number): string;
}
export interface RomHeader {
    console:     FixedLengthString;
    copyright:   FixedLengthString;
    title_local: FixedLengthString;
    title_int:   FixedLengthString;
}