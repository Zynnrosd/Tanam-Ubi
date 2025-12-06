// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { SupabaseDataSource } from './data-source' 
import type { IDataSource } from './data-source' 

// --- PERUBAHAN KRITIS: Hardcode ke mode demo ---
// Menggunakan nilai default untuk memaksa isDemoMode menjadi true
const supabaseUrl = 'https://demo.supabase.co' 
const supabaseAnonKey = 'demo-key' 

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// --- PERUBAHAN KRITIS: Paksa isDemoMode menjadi true (Menggunakan Dummy Data) ---
export const isDemoMode = true 

// Initialize the data source using the concrete Supabase implementation (POLYMORPHISM)
export const dataSource: IDataSource = new SupabaseDataSource(supabase, isDemoMode)

// Export data functions from data source
export const generateDemoData = (count: number = 24) => dataSource.generateDemoData(count)
export const generateRealtimeData = () => (dataSource as SupabaseDataSource).generateRealtimeData()