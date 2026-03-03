export default function handler(req, res) {
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds.members.read',
  });

  const url = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

  res.redirect(url);
}
