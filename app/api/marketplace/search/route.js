// =========================================================================
// THE GUESTINN NETWORK — REALTIME MARKETPLACE SEARCH FILTERING ENDPOINT
// =========================================================================
// Tech Stack: Next.js 14 Route Handlers + Supabase Vector Matching[span_5](start_span)[span_5](end_span)
// Input Schema: URL Search Parameters (?city=bhopal&maxPrice=1500)[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span)
// =========================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize server-side direct Supabase connection node[span_8](start_span)[span_8](end_span)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);[span_9](start_span)[span_9](end_span)

export async function GET(request) {
  try {
    // 1. Extract query matrices from dynamic layout context URL
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city')?.toLowerCase().trim() || '';
    const maxPrice = parseInt(searchParams.get('maxPrice')) || null;
    const isFeatured = searchParams.get('featured') === 'true';

    // 2. Build multi-tenant robust database selection pipeline
    let query = supabase
      .from('hotels')
      .select(`
        id,
        name,
        location,
        city_slug,
        total_rooms,
        emoji,
        min_floor_price,
        is_featured,
        checkout_time
      `);[span_10](start_span)[span_10](end_span)

    // Apply strict index-driven lookups to minimize server execution lag[span_11](start_span)[span_11](end_span)
    if (city) {
      // Fuzzy match fallback to catch local variations easily (e.g. 'bhopal' inside address strings)[span_12](start_span)[span_12](end_span)
      query = query.ilike('city_slug', `%${city}%`);[span_13](start_span)[span_13](end_span)
    }
    
    if (isFeatured) {
      query = query.eq('is_featured', true);
    }

    const { data: hotels, error: hotelError } = await query;

    if (hotelError) {
      return NextResponse.json({ error: hotelError.message }, { status: 400 });
    }

    // 3. Post-process properties inventory arrays to cross-check real occupancy states
    // If a hotel's baseline floor configurations cross maximum constraints, filter it out dynamically
    let filteredHotels = hotels || [];
    
    if (maxPrice) {
      filteredHotels = filteredHotels.filter(hotel => {
        // Enforce safe threshold boundary controls dynamically[span_14](start_span)[span_14](end_span)
        return hotel.min_floor_price <= maxPrice;[span_15](start_span)[span_15](end_span)
      });
    }

    // 4. Return unified transactional payload response block
    return NextResponse.json({
      success: true,
      count: filteredHotels.length,
      timestamp: new Date().toISOString(),
      properties: filteredHotels
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=5' // High speed network cache layers
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Core internal routing scanner exception occurred: ' + error.message 
    }, { status: 500 });
  }
}
