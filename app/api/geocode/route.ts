import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': 'od370yq3ix',
          'X-NCP-APIGW-API-KEY-SECRET': 'PjdSYiZq4qw7CWQVGtIuitUJJezKhkhFOU5SzizE',
          'Accept': 'application/json',
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `NCP API error: ${res.statusText}`, details: errorText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Geocoding failed', details: error.message }, { status: 500 });
  }
}
