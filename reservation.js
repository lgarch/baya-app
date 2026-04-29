document.addEventListener('DOMContentLoaded', () => {
  const apartmentsList = document.getElementById('apartments-list');
  const roomsList = document.getElementById('rooms-list');
  
  // Si on n'est pas sur la page de réservation avec les listes, on ne fait rien
  if (!apartmentsList || !roomsList) return;

  // Vider les listes (au cas où il y a un placeholder)
  apartmentsList.innerHTML = '';
  roomsList.innerHTML = '';

  const logements = window.logements || [];

  logements.forEach(logement => {
    const card = document.createElement('div');
    card.className = 'card';
    
    // Fallbacks si non défini dans data.js
    const capacity = logement.type === 'chambre' ? 2 : 4;
    const price = 500; 

    card.innerHTML = `
      <img src="${logement.image}" alt="${logement.titre}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">
      <h3>${logement.titre}</h3>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 10px; font-weight: bold;">${price} MAD / nuit • Capacité: ${capacity} pers.</p>
      <p style="font-size: 13px; margin-bottom: 20px; flex-grow: 1;">${logement.description}</p>
      <button class="btn primary-btn full-width reserver-btn" data-id="${logement.id}" data-titre="${logement.titre}" data-type="${logement.type}">Réserver</button>
    `;

    if (logement.type === 'appartement') {
      apartmentsList.appendChild(card);
    } else if (logement.type === 'chambre') {
      roomsList.appendChild(card);
    }
  });

  // Rediriger vers la page du formulaire de réservation
  document.querySelectorAll('.reserver-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const titre = e.target.getAttribute('data-titre');
      const type = e.target.getAttribute('data-type');
      
      if (id && id !== "undefined") {
        window.location.href = `booking-form.html?id=${id}`;
      } else {
        window.location.href = `booking-form.html?titre=${encodeURIComponent(titre)}&type=${encodeURIComponent(type)}`;
      }
    });
  });
});