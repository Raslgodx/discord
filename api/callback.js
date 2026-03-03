export default async function handler(req, res) {
  const { code } = req.query;

  const SITE_URL = 'https://raslpro.ru/tfssx';

  if (!code) {
    return res.redirect(`${SITE_URL}?error=no_code`);
  }

  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

  try {
    // Обмен кода на токен
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.redirect(`${SITE_URL}?error=token_failed`);
    }

    // Получаем информацию о пользователе
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();

    // Проверяем роли на сервере
    const GUILD_ID = process.env.DISCORD_GUILD_ID;
    const memberResponse = await fetch(
      `https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`,
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!memberResponse.ok) {
      return res.redirect(`${SITE_URL}?error=not_in_server`);
    }

    const memberData = await memberResponse.json();

    // Проверяем наличие любой из нужных ролей
    const REQUIRED_ROLES = process.env.DISCORD_REQUIRED_ROLES.split(',');
    const hasRole = memberData.roles.some((role) =>
      REQUIRED_ROLES.includes(role)
    );

    if (!hasRole) {
      return res.redirect(`${SITE_URL}?error=no_role`);
    }

    // Создаём простой токен сессии
    const sessionToken = Buffer.from(
      JSON.stringify({
        id: userData.id,
        username: userData.username,
        avatar: userData.avatar,
        verified: true,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Редирект обратно на страницу с кнопкой
    res.redirect(`${SITE_URL}?session=${sessionToken}`);
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`${SITE_URL}?error=server_error`);
  }
}
