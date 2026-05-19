const signupCard = document.getElementById("signupCard");
const loginCard = document.getElementById("loginCard");
const forgotCard = document.getElementById("forgotCard");
const homeCard = document.getElementById("homeCard");

const signupUsername = document.getElementById("signupUsername");
const signupPassword = document.getElementById("signupPassword");
const confirmPassword = document.getElementById("confirmPassword");

const usernameMsg = document.getElementById("usernameMsg");
const matchMsg = document.getElementById("matchMsg");

const strengthFill = document.getElementById("strengthFill");
const strengthText = document.getElementById("strengthText");
const passwordSuggestions = document.getElementById("passwordSuggestions");

const API_URL = "http://localhost:5000";

function showCard(card) {
  [signupCard, loginCard, forgotCard, homeCard].forEach(c => c.classList.remove("active"));
  card.classList.add("active");
}

document.getElementById("goLogin").onclick = () => showCard(loginCard);
document.getElementById("loginTopBtn").onclick = () => showCard(loginCard);
document.getElementById("goSignup").onclick = () => showCard(signupCard);
document.getElementById("forgotPassword").onclick = () => showCard(forgotCard);
document.getElementById("backLogin").onclick = () => showCard(loginCard);
document.getElementById("logoutBtn").onclick = () => showCard(loginCard);

document.querySelectorAll(".eyeBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === "password" ? "text" : "password";
    btn.textContent = input.type === "password" ? "👁" : "🙈";
  });
});

function validateUsername(username) {
  const pattern = /^[a-z0-9._]+$/;

  if (username.length < 3) {
    return "Username must be at least 3 characters.";
  }

  if (!pattern.test(username)) {
    return "Only lowercase letters, numbers, dot and underscore allowed.";
  }

  if (username.startsWith(".") || username.startsWith("_")) {
    return "Username cannot start with dot or underscore.";
  }

  if (username.endsWith(".") || username.endsWith("_")) {
    return "Username cannot end with dot or underscore.";
  }

  if (username.includes(" ")) {
    return "Username cannot contain spaces.";
  }

  return "valid";
}

signupUsername.addEventListener("input", () => {
  const result = validateUsername(signupUsername.value);

  if (result === "valid") {
    usernameMsg.textContent = "✓ Username looks good";
    usernameMsg.style.color = "#81ffb0";
  } else {
    usernameMsg.textContent = result;
    usernameMsg.style.color = "#ffce7a";
  }

  analyzePassword();
});

function setRule(id, condition) {
  const item = document.getElementById(id);
  item.classList.toggle("valid", condition);
  item.textContent = (condition ? "✓ " : "✗ ") + item.textContent.substring(2);
}

function analyzePassword() {
  const password = signupPassword.value;
  const username = signupUsername.value.toLowerCase();

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const noUsername = username && !password.toLowerCase().includes(username);

  setRule("ruleLength", hasLength);
  setRule("ruleUpper", hasUpper);
  setRule("ruleLower", hasLower);
  setRule("ruleNumber", hasNumber);
  setRule("ruleSymbol", hasSymbol);
  setRule("ruleUsername", noUsername);

  let score = 0;
  if (hasLength) score++;
  if (hasUpper) score++;
  if (hasLower) score++;
  if (hasNumber) score++;
  if (hasSymbol) score++;
  if (noUsername) score++;

  if (!password) {
    strengthFill.style.width = "0";
    strengthText.textContent = "Password strength will appear here";
    return score;
  }

  if (score <= 2) {
    strengthFill.style.width = "30%";
    strengthFill.style.background = "#ff4d4d";
    strengthText.textContent = "Weak Password";
  } else if (score <= 4) {
    strengthFill.style.width = "65%";
    strengthFill.style.background = "#ffd166";
    strengthText.textContent = "Medium Password";
  } else {
    strengthFill.style.width = "100%";
    strengthFill.style.background = "#81ffb0";
    strengthText.textContent = "Strong Password";
  }

  generateSuggestions();
  return score;
}

signupPassword.addEventListener("input", analyzePassword);

confirmPassword.addEventListener("input", () => {
  if (confirmPassword.value === signupPassword.value) {
    matchMsg.textContent = "✓ Passwords match";
    matchMsg.style.color = "#81ffb0";
  } else {
    matchMsg.textContent = "✗ Passwords do not match";
    matchMsg.style.color = "#ff8f8f";
  }
});

function generateSuggestions() {
  const username = signupUsername.value || "user";
  const cleanName = username.replace(/[^a-z0-9]/g, "");

  const suggestions = [
    `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}@2026#Secure`,
    `Thirnex_${cleanName}@${Math.floor(Math.random() * 9000 + 1000)}`,
    `${cleanName}#Safe${Math.floor(Math.random() * 90 + 10)}X`
  ];

  passwordSuggestions.innerHTML = "";

  suggestions.forEach(pass => {
    const btn = document.createElement("button");
    btn.textContent = pass;
    btn.onclick = () => {
      signupPassword.value = pass;
      confirmPassword.value = pass;
      analyzePassword();
      matchMsg.textContent = "✓ Passwords match";
      matchMsg.style.color = "#81ffb0";
    };
    passwordSuggestions.appendChild(btn);
  });
}

document.getElementById("signupBtn").addEventListener("click", async () => {
  const username = signupUsername.value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = signupPassword.value;
  const confirm = confirmPassword.value;

  const usernameCheck = validateUsername(username);
  const score = analyzePassword();

  if (usernameCheck !== "valid") {
    alert("Please enter a valid username.");
    return;
  }

  if (score < 5) {
    alert("Please create a strong password.");
    return;
  }

  if (password !== confirm) {
    alert("Passwords do not match.");
    return;
  }

  const data = {
    username,
    email,
    password,
    answer1: document.getElementById("answer1").value.trim(),
    answer2: document.getElementById("answer2").value.trim(),
    answer3: document.getElementById("answer3").value.trim()
  };

  try {
    const res = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.message);

    if (res.ok) {
      showCard(loginCard);
    }
  } catch {
    alert("Backend not connected yet.");
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  const user = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user, password })
    });

    const result = await res.json();
    alert(result.message);

    if (res.ok) {
      showCard(homeCard);
    }
  } catch {
    alert("Backend not connected yet.");
  }
});

document.getElementById("findUserBtn").addEventListener("click", async () => {
  const username = document.getElementById("forgotUsername").value.trim();

  try {
    const res = await fetch(`${API_URL}/find-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username })
    });

    const result = await res.json();
    alert(result.message);

    if (res.ok) {
      document.getElementById("securitySection").classList.remove("hidden");
    }
  } catch {
    alert("Backend not connected yet.");
  }
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  const data = {
    username: document.getElementById("forgotUsername").value.trim(),
    answer1: document.getElementById("forgotAns1").value.trim(),
    answer2: document.getElementById("forgotAns2").value.trim(),
    answer3: document.getElementById("forgotAns3").value.trim(),
    newPassword: document.getElementById("newPassword").value
  };

  try {
    const res = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.message);

    if (res.ok) {
      showCard(loginCard);
    }
  } catch {
    alert("Backend not connected yet.");
  }
});