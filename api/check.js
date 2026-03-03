export default function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

    // Проверяем что токен не старше 24 часов
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAge) {
      return res.status(401).json({ error: 'Сессия истекла' });
    }

    if (!data.verified) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    // Всё ок — отдаём контент
    return res.status(200).json({
      success: true,
      user: {
        username: data.username,
        avatar: data.avatar,
        id: data.id,
      },
      content: {
        title: 'Добро пожаловать!',
        message: 'У вас есть доступ к закрытому контенту.',
        // Сюда можно добавить любой контент
        blocks: [
          {
            type: 'text',
            value:
              'Это секретный контент, доступный только участникам с нужной ролью.',
          },
          {
            type: 'text',
            value: 'Здесь можно разместить любую информацию.',
          },
        ],
      },
    });
  } catch (error) {
    return res.status(401).json({ error: 'Неверный токен' });
  }
}
