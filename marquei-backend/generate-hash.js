const bcrypt = require('bcryptjs');

bcrypt.hash('senha123', 10, (err, hash) => {
  if (err) {
    console.error('Erro:', err);
  } else {
    console.log('Hash de senha123:');
    console.log(hash);
  }
});
