async function deriveKey(password, salt, iterations, hash, keyLength) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey", "deriveBits"]
  );

  // Настройки для PBKDF2
  const pbkdf2Params = {
    name: "PBKDF2",
    salt: new TextEncoder().encode(salt),
    iterations,
    hash,
  };

  // Создаем ключ из пароля
  const derivedKey = await crypto.subtle.deriveKey(
    pbkdf2Params,
    passwordKey,                           // Исходный ключ
    { name: "AES-GCM", length: keyLength }, // Алгоритм и длина ключа
    true,                                 // Ключ нельзя экспортировать
    ["encrypt", "decrypt"]                 // Операции, разрешенные с этим ключом
  );

  const exportedKey = await crypto.subtle.exportKey("raw", derivedKey);

  // Возвращаем Uint8Array
  return new Uint8Array(exportedKey);
}

async function makeKey(masterPassword, username) {
  const salt = `io.github.supersasha:${username.length}:${username}`;
  return await deriveKey(masterPassword, salt, 200000, 'SHA-256', 256);
}

const CHAR_CLASSES = [
  'abcdefghijklmnopqrstuvwxyz',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  '0123456789',
  '!#$%&()*+-;<=>?@^_`{|}~',
];

async function generate(/*options*/) {
  //const { master, domain, version, charClasses, len } = options;
  const username = document.getElementById('username').value;
  const master = document.getElementById('master').value;
  const domain = document.getElementById('domain').value;
  const version = document.getElementById('version').value;
  const len = parseInt(document.getElementById('length').value, 10);

  const charClasses = [];
  if (document.getElementById('letters').checked) {
    charClasses.push(0);
  }
  if (document.getElementById('capitals').checked) {
    charClasses.push(1);
  }
  if (document.getElementById('digits').checked) {
    charClasses.push(2);
  }
  if (document.getElementById('symbols').checked) {
    charClasses.push(3);
  }

  const encoder = new TextEncoder();
  const t0 = Date.now();
  const part1 = await makeKey(master, username);
  const part2 = encoder.encode(`${domain}:${version}`);
  const data = new Uint8Array([...part1, ...part2]);
  const digest = await crypto.subtle.digest('SHA-512', data);
  const bytes = new Uint8Array(digest);
  const classes = [...charClasses];
  const usedClasses = new Set();

  let password = '';
  for (let i = 0; i < len; i++) {
    if (charClasses.length - usedClasses.size === len - i) {
      for (let j = 0; j < classes.length;) {
        if (usedClasses.has(classes[j])) {
          classes.splice(j, 1);
        } else {
          j++;
        }
      }
    }
    const cls = classes[bytes[i * 3] % classes.length];
    usedClasses.add(cls);
    const charIndex = (bytes[i * 3 + 1] * 256 + bytes[i * 3 + 2]) % CHAR_CLASSES[cls].length;
    password += CHAR_CLASSES[cls][charIndex];
  }
  document.getElementById('genpass').value = password;
  await navigator.clipboard.writeText(password);
}

function toggleShow() {
  const cbShow = document.getElementById('show');
  const elPass = document.getElementById('genpass');
  if (cbShow.checked) {
    elPass.type = 'text';
  } else {
    elPass.type = 'password';
  }
}
