'use client';
import { useSearchParams } from 'next/navigation';
import React from 'react';

const DISCORD_TOKEN_API = 'https://discord.com/api/v10/oauth2/token';

export default function Authorize() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorMessage = searchParams.get('error_description');
  const REDIRECT_URI = 'http://localhost:3000/authorize';

  function ExchangeCode() {
    if (!code) return;
    const clientID = process.env.DISCORD_CLIENTID ?? 'null';
    const clientSecret = process.env.DISCORD_SECRET ?? 'null';
    const params = new URLSearchParams({
      'client_id': clientID,
      'client_secret': clientSecret,
      'grant_type': 'authorization_code',
      'code': code,
      'redirect_uri': REDIRECT_URI,
      'scope': 'identify guilds email',
    });
    // let user;
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    fetch(`${DISCORD_TOKEN_API}?${params}`, {
      method: 'POST',
      headers: headers,
      body: params
    })
      .then(response => response.json())
      .then(data => { 
        /*{
            token_type: 'Bearer',
            access_token: '',
            expires_in: 604800,
            refresh_token: '',
            scope: 'identify guilds email'
        }*/
        console.log(data);
      });
  }
  //   React.useEffect(() => ExchangeCode());
  ExchangeCode();
  return <>{code ?? `${error}: ${errorMessage}`}</>;
}