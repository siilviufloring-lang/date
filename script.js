let currentUser = null;
let chart;

// ================= AUTH =================

function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) return;

    const users = JSON.parse(localStorage.getItem("users")) || {};

    if (users[username]) {
        document.getElementById("auth-msg").textContent = "User exists.";
        return;
    }

   const role = document.getElementById("role").value;

users[username] = {
    password,
    xp: 0,
    level: 1,
    role,
    workouts: {}
};


    localStorage.setItem("users", JSON.stringify(users));
    document.getElementById("auth-msg").textContent = "Registered.";
}

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const users = JSON.parse(localStorage.getItem("users")) || {};

    if (!users[username] || users[username].password !== password) {
        document.getElementById("auth-msg").textContent = "Wrong login.";
        return;
    }

    currentUser = username;

    document.getElementById("auth").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("welcome").textContent = "Welcome " + username;
    const userData = users[username];

if (userData.role === "queen") {
    document.body.style.background = "linear-gradient(-45deg, #1a001a, #330033, #000000)";
}

document.getElementById("welcome").innerHTML =
    "Welcome " + username + " 👑 " + userData.role.toUpperCase();

if (userData.role === "king") {
    document.body.classList.add("king-glow");
} else {
    document.body.classList.add("queen-glow");
}

    loadUserData();
}

function logout() {
    location.reload();
}

// ================= WORKOUT SYSTEM =================

function addWorkout() {
    const name = document.getElementById("workout-name").value;
    const calories = parseInt(document.getElementById("calories").value);

    if (!name || !calories) return;

    const users = JSON.parse(localStorage.getItem("users"));
    const today = new Date().toISOString().split("T")[0];

    if (!users[currentUser].workouts[today]) {
        users[currentUser].workouts[today] = [];
    }

    users[currentUser].workouts[today].push({ name, calories });

    // XP
    users[currentUser].xp += Math.floor(calories / 5);

    let xpNeeded = users[currentUser].level * 100;

    if (users[currentUser].xp >= xpNeeded) {
        users[currentUser].xp = 0;
        users[currentUser].level++;
        alert("🔥 LEVEL UP 🔥");
        showLevelUp();
    }
    localStorage.setItem("users", JSON.stringify(users));
loadUserData(); // va verifica și va afișa badge-urile

    localStorage.setItem("users", JSON.stringify(users));

    loadUserData();
}

function loadUserData() {
    const users = JSON.parse(localStorage.getItem("users"));
    const user = users[currentUser];

    updateLevelUI(user);
    renderTodayWorkouts(user);
    renderChart(user);
    renderLeaderboard();
    showQuote();
    checkBadges(user); // verifică realizările


}

function updateLevelUI(user) {
    document.getElementById("level").textContent = user.level;
    document.getElementById("xp").textContent = user.xp;
    document.getElementById("xp-needed").textContent = user.level * 100;

    let percent = (user.xp / (user.level * 100)) * 100;
    document.getElementById("progress").style.width = percent + "%";
}

function renderTodayWorkouts(user) {
    const list = document.getElementById("workout-list");
    list.innerHTML = "";

    const today = new Date().toISOString().split("T")[0];
    const workouts = user.workouts[today] || [];

    workouts.forEach(w => {
        const li = document.createElement("li");
        li.textContent = w.name + " - " + w.calories + " kcal";
        list.appendChild(li);
    });
}

function renderChart(user) {
    const ctx = document.getElementById("chart").getContext("2d");

    const last7 = [];
    const labels = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split("T")[0];

        labels.push(key.slice(5));

        const workouts = user.workouts[key] || [];
        const total = workouts.reduce((sum, w) => sum + w.calories, 0);
        last7.push(total);
    }

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Calories",
                data: last7,
                borderColor: "red",
                backgroundColor: "rgba(255,0,0,0.2)",
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });
    function renderLeaderboard() {
    const users = JSON.parse(localStorage.getItem("users")) || {};
    const leaderboardDiv = document.getElementById("leaderboard");

    const sortedUsers = Object.entries(users).sort((a, b) => {
        const scoreA = a[1].level * 1000 + a[1].xp;
        const scoreB = b[1].level * 1000 + b[1].xp;
        return scoreB - scoreA;
    });

    leaderboardDiv.innerHTML = "";

    sortedUsers.forEach((user, index) => {
        const div = document.createElement("div");
        div.classList.add("leaderboard-item");

        if (index === 0) div.classList.add("rank-1");
        if (index === 1) div.classList.add("rank-2");
        if (index === 2) div.classList.add("rank-3");

        div.innerHTML = `
            <span>#${index + 1} ${user[0]}</span>
            <span>Level ${user[1].level} (${user[1].xp} XP)</span>
        `;

        leaderboardDiv.appendChild(div);
    });
}
const quotes = [
    "You don’t get what you wish for. You get what you work for.",
    "Pain is weakness leaving the body.",
    "Be obsessed or be average.",
    "Nobody cares. Work harder.",
    "Discipline is choosing what you want most over what you want now.",
    "Built from pain. Powered by discipline.",
    "You vs You. Every single day.",
    "Winners train. Losers complain."
];
const badges = [
    { id: 1, name: "Primul Workout", condition: user => Object.keys(user.workouts).length >= 1 },
    { id: 2, name: "Nivelul 5", condition: user => user.level >= 5 },
    { id: 3, name: "1000 kcal arse", condition: user => {
        const totalCalories = Object.values(user.workouts).flat().reduce((sum, w) => sum + w.calories, 0);
        return totalCalories >= 1000;
    }},
    // Poți adăuga mai multe realizări după nevoie
];
function checkBadges(user) {
    if (!user.badges) user.badges = [];
    badges.forEach(badge => {
        if (!user.badges.includes(badge.name) && badge.condition(user)) {
            user.badges.push(badge.name);
            alert(`🔥 Ai primit badge-ul: ${badge.name}!`);
            displayBadge(badge.name);
        }
    });
}

function displayBadge(badgeName) {
    const badgeDiv = document.createElement('div');
    badgeDiv.className = 'badge';
    badgeDiv.textContent = badgeName;
    document.body.appendChild(badgeDiv);
    setTimeout(() => {
        badgeDiv.remove();
    }, 3000); // Badge dispare după 3 secunde
}

function showQuote() {
    const random = Math.floor(Math.random() * quotes.length);
    const quoteDiv = document.getElementById("quote");
    quoteDiv.textContent = quotes[random];
    function showLevelUp() {
    document.getElementById('level-up-overlay').classList.remove('hidden');
    // Poți adăuga efecte de confetti aici, folosind o librărie precum Canvas Confetti
    confettiAnimation(); // funcție opțională
}

function closeLevelUp() {
    document.getElementById('level-up-overlay').classList.add('hidden');
}

function confettiAnimation() {
    // Exemplu simplu: poți integra o librărie precum canvas-confetti
    // sau poți crea confetti personalizat
    // Exemplu cu canvas-confetti:
    if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
}
}

function confettiAnimation() {
    if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
        console.log("Confetti library nu este încă încărcată");
    }
}
function togglePasswordFields() {
    const fields = document.getElementById('password-inputs');
    // Dacă e ascuns îl arătăm, dacă e vizibil îl ascundem
    if (fields.style.display === "none") {
        fields.style.display = "block";
    } else {
        fields.style.display = "none";
    }
}

function updatePassword() {
    const newPass = document.getElementById('new-password').value;
    const msg = document.getElementById('pass-msg');
    
    // Luăm numele utilizatorului logat (trebuie să îl fi salvat la login)
    const currentUser = localStorage.getItem('currentUser'); 

    if (!newPass || newPass.length < 4) {
        msg.innerText = "Parola e prea scurtă!";
        msg.style.color = "#ff4d4d";
        return;
    }

    // Luăm obiectul cu toți utilizatorii din baza de date locală
    let users = JSON.parse(localStorage.getItem('users')) || {};

    if (currentUser && users[currentUser]) {
        // Actualizăm parola în obiect
        users[currentUser].password = newPass;
        // Salvăm obiectul întreg înapoi în localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        msg.innerText = "Parolă actualizată! ✅";
        msg.style.color = "#4CAF50";
        document.getElementById('new-password').value = ""; // curățăm input-ul
    } else {
        msg.innerText = "Eroare: Utilizator negăsit!";
        msg.style.color = "#ff4d4d";
    }
}
function addWorkout() {
    const calories = parseInt(document.getElementById('calories').value);
    const currentUser = localStorage.getItem('currentUser');
    
    if (!calories || !currentUser) return;

    // 1. Luăm datele actuale
    let users = JSON.parse(localStorage.getItem('users')) || {};
    let user = users[currentUser];

    // 2. Calculăm noul XP (Ex: 1 calorie = 1 XP)
    user.xp = (user.xp || 0) + calories;

    // 3. Verificăm dacă face Level Up (Ex: la fiecare 1000 XP)
    let newLevel = Math.floor(user.xp / 1000) + 1;
    if (newLevel > user.level) {
        user.level = newLevel;
        // Aici poți declanșa confetti-ul tău!
        confetti(); 
    }

    // 4. Salvăm înapoi în baza de date locală
    users[currentUser] = user;
    localStorage.setItem('users', JSON.stringify(users));

    // 5. Actualizăm interfața pe pagina curentă
    updateUI(); 
}
}
