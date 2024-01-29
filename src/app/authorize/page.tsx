/* eslint-disable @next/next/no-async-client-component */
'use client';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

const DISCORD_TOKEN_API = 'https://discord.com/api/v10/oauth2/token';
const REDIRECT_URI = 'http://localhost:3000/authorize';



export default function Authorize() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorMessage = searchParams.get('error_description');
  const [avatarURL, setAvatarURL] = useState('');
  const [tokenData, setTokenData] = useState({token_type: '', access_token: ''});

  const [userData, setUserData] = useState({
    id: 'null',
    username: 'null',
    avatar: 'null',
    discriminator: '0',
    public_flags: 128,
    premium_type: 2,
    flags: 128,
    banner: 'null',
    accent_color: null,
    global_name: 'null',
    avatar_decoration_data: null,
    banner_color: null,
    mfa_enabled: false,
    locale: 'en-US',
    email: 'null',
    verified: false
  });
  
  useEffect(() => {
    async function ExchangeCode() {
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
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      setTokenData(await fetch(`${DISCORD_TOKEN_API}?${params}`, {
        method: 'POST',
        headers: headers,
        body: params,
        next: {
          revalidate: 3600
        },
        cache: 'force-cache'
      })
        .then(response => response.json())
        .catch(console.error));
    }
    ExchangeCode();
  }, []);
  useEffect(() => {
    async function getUserData() {
      console.log('tokenData', tokenData);
      const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
          authorization: `${tokenData.token_type} ${tokenData.access_token}`,
        },
        next: {
          revalidate: 3600
        },
        cache: 'force-cache'
      })
        .then(result => result.json())
        .catch(console.error);
        
      setUserData(response);
      const { username, discriminator, id, email, globalName, avatar } = response;
      setAvatarURL(`https://cdn.discordapp.com/avatars/${id}/${avatar}`);
      console.log('response:', response);
      console.log('userdata:', userData);
      console.log(`${username}#${discriminator}`);
      console.log(avatarURL);
    }
    getUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tokenData]);
  return <>
    {!error ? <Image src={avatarURL} alt='avatar_image' width={100} height={100} /> : `${error}: ${errorMessage}`}</>;
}