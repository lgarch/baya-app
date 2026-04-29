document.addEventListener('DOMContentLoaded', async () => {
  console.log("Baya House loaded");

  let logementsData = [];

  // Essayer de récupérer les données depuis le backend (API)
  try {
    const response = await fetch('/api/logements');
    if (response.ok) {
      logementsData = await response.json();
    } else {
      throw new Error("Backend non disponible");
    }
  } catch (error) {
    console.warn("⚠️ API introuvable, utilisation des données locales (data.js)");
    if (window.logements) {
      logementsData = window.logements;
    } else {
      console.error("❌ Les données locales sont également introuvables.");
      return;
    }
  }

  // Injecter les appartements en vedette dans index.html
  const appartementsContainer = document.getElementById("featured-apartments");
  if (appartementsContainer) {
    const appartements = logementsData.filter(item => item.type === "appartement").slice(0, 3);
    appartements.forEach(app => {
      appartementsContainer.innerHTML += `
        <div class="card">
          <img src="${app.image}" alt="${app.titre}" loading="lazy" class="card-img" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 15px;" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Non+Disponible'">
          <h3>${app.titre}</h3>
          <p>${app.description.substring(0, 80)}...</p>
          <a href="details.html?id=${app.id}" class="btn secondary btn-small">Voir plus</a>
        </div>
      `;
    });
  }

  // Injecter les chambres en vedette dans index.html
  const chambresContainer = document.getElementById("featured-rooms");
  if (chambresContainer) {
    const chambres = logementsData.filter(item => item.type === "chambre").slice(0, 3);
    chambres.forEach(ch => {
      chambresContainer.innerHTML += `
        <div class="card">
          <img src="${ch.image}" alt="${ch.titre}" loading="lazy" class="card-img" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 15px;" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Non+Disponible'">
          <h3>${ch.titre}</h3>
          <p>${ch.description.substring(0, 80)}...</p>
          <a href="details.html?id=${ch.id}" class="btn secondary btn-small">Voir plus</a>
        </div>
      `;
    });
  }

  // Faire défiler vers l'ancre (ex: #contact) une fois le contenu dynamique chargé
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }
});