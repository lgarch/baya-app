import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const logementId = urlParams.get('id');
  const logementTitre = urlParams.get('titre');
  const logementType = urlParams.get('type');

  let selectedLogement = null;
  const logements = window.logements || [];

  if (logementId) {
    selectedLogement = logements.find(l => l.id === logementId);
  } else if (logementTitre) {
    selectedLogement = logements.find(l => l.titre === logementTitre && (!logementType || l.type === logementType));
  }

  const summaryContainer = document.getElementById('property-summary');

  if (selectedLogement) {
    document.getElementById('logementId').value = selectedLogement.id || '';
    document.getElementById('logementTitre').value = selectedLogement.titre || logementTitre;
    document.getElementById('logementType').value = selectedLogement.type || logementType;

    const capacity = selectedLogement.type === 'chambre' ? 2 : 4;
    const price = 500; 

    summaryContainer.innerHTML = `
      <img src="${selectedLogement.image}" alt="${selectedLogement.titre}">
      <div class="property-details">
        <h3>${selectedLogement.titre}</h3>
        <p>${selectedLogement.type === 'chambre' ? 'Chambre' : 'Appartement'} • ${price} MAD / nuit</p>
        <p>Capacité max: ${capacity} personnes</p>
      </div>
    `;
  } else if (logementTitre) {
    document.getElementById('logementTitre').value = logementTitre;
    document.getElementById('logementType').value = logementType || '';
    
    summaryContainer.innerHTML = `
      <div class="property-details">
        <h3>${logementTitre}</h3>
        <p>${logementType === 'chambre' ? 'Chambre' : 'Appartement'}</p>
      </div>
    `;
  } else {
    summaryContainer.innerHTML = `<p style="color: red;">Aucun logement sélectionné. Veuillez retourner à la page des réservations.</p>`;
    const submitBtn = document.querySelector('button[type="submit"]');
    if(submitBtn) submitBtn.disabled = true;
  }

  let globalBlockedDates = [];

  // --- Initialisation de Flatpickr ---
  const checkinPicker = flatpickr("#checkin", {
    dateFormat: "Y-m-d",
    minDate: "today",
    disable: [],
    locale: "fr",
    onDayCreate: function(dObj, dStr, fp, dayElem) {
      if (dayElem.classList.contains('flatpickr-disabled')) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dayElem.dateObj < today) {
          dayElem.setAttribute('title', 'Date passée');
        } else {
          dayElem.setAttribute('title', 'Déjà réservé');
        }
      }
    },
    onChange: function(selectedDates, dateStr, instance) {
      if (selectedDates.length > 0) {
        checkoutPicker.set('minDate', dateStr);
        
        // Trouver la prochaine date bloquée après la date d'arrivée
        const selectedDate = selectedDates[0];
        const nextBlockedDate = globalBlockedDates.find(d => new Date(d) > selectedDate);
        
        if (nextBlockedDate) {
          // Bloquer le checkout à partir de cette date
          checkoutPicker.set('maxDate', nextBlockedDate);
        } else {
          checkoutPicker.set('maxDate', null);
        }
      }
    }
  });

  const checkoutPicker = flatpickr("#checkout", {
    dateFormat: "Y-m-d",
    minDate: "today",
    disable: [],
    locale: "fr",
    onDayCreate: function(dObj, dStr, fp, dayElem) {
      if (dayElem.classList.contains('flatpickr-disabled')) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dayElem.dateObj < today) {
          dayElem.setAttribute('title', 'Date passée');
        } else {
          dayElem.setAttribute('title', 'Déjà réservé');
        }
      }
    }
  });

  // --- Récupération des dates bloquées depuis Firebase ---
  const titreToSearch = selectedLogement ? selectedLogement.titre : logementTitre;
  const typeToSearch = selectedLogement ? selectedLogement.type : logementType;
  
  if (titreToSearch) {
    try {
      const colName = (typeToSearch === 'chambre') ? 'rooms' : 'apartments';
      const q = query(collection(db, colName), where("name", "==", titreToSearch));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.blockedDates && Array.isArray(data.blockedDates)) {
          globalBlockedDates = globalBlockedDates.concat(data.blockedDates);
        }
      });

      if (globalBlockedDates.length > 0) {
        // Trier les dates en ordre croissant
        globalBlockedDates.sort((a, b) => new Date(a) - new Date(b));

        // Mettre à jour les calendriers avec les dates bloquées
        checkinPicker.set('disable', globalBlockedDates);
        checkoutPicker.set('disable', globalBlockedDates);
        console.log("Dates bloquées récupérées et triées:", globalBlockedDates);

        // Afficher le message permanent
        const msgContainer = document.getElementById('unavailable-dates-message');
        const listSpan = document.getElementById('unavailable-dates-list');
        if (msgContainer && listSpan) {
          // Formater les dates pour un affichage lisible
          const formattedDates = globalBlockedDates.map(d => {
            const parts = d.split('-');
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          });
          listSpan.textContent = formattedDates.join(', ');
          msgContainer.style.display = 'flex';
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des dates bloquées:", error);
    }
  }

  // --- Gérer la soumission du formulaire ---
  const form = document.getElementById('booking-form');
  if(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Traitement en cours...';

      const formData = new FormData(form);
      const reservationData = {
        logementId: formData.get('logementId'),
        logementTitre: formData.get('logementTitre'),
        logementType: formData.get('logementType'),
        clientNom: formData.get('fullName'),
        clientEmail: formData.get('email'),
        clientTelephone: formData.get('phone'),
        dateArrivee: formData.get('checkin'),
        dateDepart: formData.get('checkout'),
        nombrePersonnes: formData.get('guests'),
        message: formData.get('message'),
        status: "Nouvelle"
      };

      try {
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reservationData)
        });

        if (!response.ok) {
          console.warn("L'API locale n'a pas répondu correctement.");
        }

        const whatsappNumber = "212670805960"; 
        
        let text = `Bonjour Baya Apartment ⭐\n\n`;
        text += `Je souhaite finaliser ma réservation :\n`;
        text += `Logement: ${reservationData.logementType} - ${reservationData.logementTitre}\n`;
        text += `Nom: ${reservationData.clientNom}\n`;
        text += `Téléphone: ${reservationData.clientTelephone}\n`;
        text += `Dates: du ${reservationData.dateArrivee} au ${reservationData.dateDepart}\n`;
        text += `Personnes: ${reservationData.nombrePersonnes}\n`;
        
        if (reservationData.message) {
          text += `\nDemande spéciale: ${reservationData.message}\n`;
        }
        
        text += `\nPouvez-vous me confirmer cette réservation ?`;

        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank");
        
        summaryContainer.innerHTML = `<div style="padding: 20px; background: #e8f5e9; color: #2e7d32; border-radius: 8px; text-align: center;">
          <h3>Merci !</h3>
          <p>Votre demande a été enregistrée. Vous allez être redirigé vers WhatsApp pour finaliser avec nous.</p>
        </div>`;
        form.style.display = 'none';

      } catch (error) {
        console.error("Erreur lors de la réservation:", error);
        alert("Une erreur est survenue lors de la préparation de votre réservation. Veuillez réessayer.");
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmer et envoyer sur WhatsApp';
      }
    });
  }
});
