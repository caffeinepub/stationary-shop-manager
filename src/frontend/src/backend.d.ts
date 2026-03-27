import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Transaction {
    id: bigint;
    user: Principal;
    totalCost: number;
    totalProfit: number;
    timestamp: Time;
    items: Array<TransactionItem>;
    totalRevenue: number;
}
export type Time = bigint;
export interface TransactionItem {
    sellingPrice: number;
    productId: bigint;
    productName: string;
    quantity: bigint;
    costPrice: number;
}
export interface Report {
    totalCost: number;
    totalProfit: number;
    topProducts: Array<[string, bigint]>;
    totalRevenue: number;
    transactionCount: bigint;
}
export interface Product {
    id: bigint;
    created: Time;
    name: string;
    sellingPrice: number;
    stock: bigint;
    updated: Time;
    category: string;
    costPrice: number;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(product: Product): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProduct(id: bigint): Promise<Product>;
    getProducts(): Promise<Array<Product>>;
    getReport(): Promise<Report>;
    getTransaction(id: bigint): Promise<Transaction>;
    getTransactions(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    recordTransaction(inputItems: Array<TransactionItem>): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateProduct(id: bigint, product: Product): Promise<void>;
}
