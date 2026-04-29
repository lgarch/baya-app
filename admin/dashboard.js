import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// DOM Elements
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const apartmentsList = document.getElementById('apartments-list');
const roomsList = document.getElementById('rooms-list');

const formModal = document.getElementById('form-modal');
const closeFormBtn = document.getElementById('close-form-btn');
const addApartmentBtn = document.getElementById('add-apartment-btn');
const addRoomBtn = document.getElementById('add-room-btn');
const apartmentForm = document.getElementById('apartment-form');
const modalTitle = document.getElementById('modal-title');
const collectionTypeInput = document.getElementById('collection-type');

const calendarModal = document.getElementById('calendar-modal');
const closeCalBtn = document.getElementById('close-cal-btn');
const calAptName = document.getElementById('cal-apt-name');
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYear = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const saveDatesBtn = document.getElementById('save-dates-btn');
const blockAllBtn = document.getElementById('block-all-btn');
const unblockAllBtn = document.getElementById('unblock-all-btn');

let currentApartments = [];
let currentRooms = [];
let currentEditingId = null;
let currentCalendarDocId = null;
let currentCalendarCollection = null;
let tempBlockedDates = new Set();
let displayedMonth = new Date().getMonth();
let displayedYear = new Date().getFullYear();

// Check Auth (Bypass)
if (localStorage.getItem('admin_logged_in') !== 'true') {
  window.location.href = "index.html";
} else {
  userEmailSpan.textContent = "admin@gmail.com";
  loadAllData();
}

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('admin_logged_in');
  window.location.href = "index.html";
});

// Fetch & Display
async function loadAllData() {
  await loadData("apartments", apartmentsList, (arr) => currentApartments = arr);
  await loadData("rooms", roomsList, (arr) => currentRooms = arr);
}

async function loadData(collectionName, container, setArray) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const arr = [];
    container.innerHTML = '';
    
    if (querySnapshot.empty) {
      container.innerHTML = `<p style="color: var(--text-muted);">Aucun logement trouvé.</p>`;
      setArray(arr);
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      arr.push({ id, ...data });

      const card = document.createElement('div');
      card.className = 'card';
      
      // Make whole card clickable for calendar
      card.addEventListener('click', (e) => {
        // Prevent opening calendar if we click on action buttons
        if(e.target.closest('.card-actions')) return;
        openCalendarModal(id, collectionName);
      });

      card.innerHTML = `
        <h3>${data.name}</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 15px;">${data.price} MAD/nuit • ${data.maxGuests} pers.</p>
        <p style="font-size: 13px; margin-bottom: 15px; flex-grow: 1;">${data.description ? data.description.substring(0, 80) : ''}...</p>
        <div class="card-actions">
          <button class="btn secondary-btn edit-btn" data-id="${id}" data-col="${collectionName}" style="padding: 8px 12px; font-size: 13px;">Modifier</button>
          <button class="btn danger-btn del-btn" data-id="${id}" data-col="${collectionName}" style="padding: 8px 12px; font-size: 13px;">Supprimer</button>
        </div>
      `;
      container.appendChild(card);
    });

    setArray(arr);
    attachCardListeners(container);
  } catch (error) {
    console.error(`Erreur de chargement ${collectionName}: `, error);
    container.innerHTML = '<p style="color: var(--danger-color);">Erreur lors du chargement des données. Avez-vous configuré Firebase ?</p>';
  }
}

function attachCardListeners(container) {
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openFormModal(e.target.dataset.id, e.target.dataset.col));
  });
  container.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', (e) => deleteItem(e.target.dataset.id, e.target.dataset.col));
  });
}

// ---- FORM MODAL (Add/Edit) ----
addApartmentBtn.addEventListener('click', () => {
  openEmptyFormModal("apartments", "Ajouter un appartement");
});

addRoomBtn.addEventListener('click', () => {
  openEmptyFormModal("rooms", "Ajouter une chambre");
});

function openEmptyFormModal(collectionType, title) {
  currentEditingId = null;
  apartmentForm.reset();
  modalTitle.textContent = title;
  collectionTypeInput.value = collectionType;
  formModal.classList.add('active');
}

closeFormBtn.addEventListener('click', () => {
  formModal.classList.remove('active');
});

apartmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const colType = collectionTypeInput.value;
  const data = {
    name: document.getElementById('name').value,
    description: document.getElementById('description').value,
    price: Number(document.getElementById('price').value),
    maxGuests: Number(document.getElementById('maxGuests').value),
    image: document.getElementById('image').value,
    blockedDates: [] 
  };

  try {
    if (currentEditingId) {
      const arr = colType === "apartments" ? currentApartments : currentRooms;
      const existing = arr.find(a => a.id === currentEditingId);
      if(existing && existing.blockedDates) {
        data.blockedDates = existing.blockedDates;
      }
      await updateDoc(doc(db, colType, currentEditingId), data);
    } else {
      await addDoc(collection(db, colType), data);
    }
    formModal.classList.remove('active');
    loadAllData();
  } catch (error) {
    alert("Erreur lors de l'enregistrement : " + error.message);
  }
});

function openFormModal(id, colType) {
  currentEditingId = id;
  collectionTypeInput.value = colType;
  const arr = colType === "apartments" ? currentApartments : currentRooms;
  const item = arr.find(a => a.id === id);
  if (!item) return;

  document.getElementById('name').value = item.name;
  document.getElementById('description').value = item.description;
  document.getElementById('price').value = item.price;
  document.getElementById('maxGuests').value = item.maxGuests;
  document.getElementById('image').value = item.image || '';
  
  modalTitle.textContent = colType === "apartments" ? "Modifier l'appartement" : "Modifier la chambre";
  formModal.classList.add('active');
}

async function deleteItem(id, colType) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
    try {
      await deleteDoc(doc(db, colType, id));
      loadAllData();
    } catch (error) {
      alert("Erreur lors de la suppression : " + error.message);
    }
  }
}

// ---- CALENDAR MODAL ----
closeCalBtn.addEventListener('click', () => {
  calendarModal.classList.remove('active');
});

prevMonthBtn.addEventListener('click', () => {
  displayedMonth--;
  if (displayedMonth < 0) { displayedMonth = 11; displayedYear--; }
  renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  displayedMonth++;
  if (displayedMonth > 11) { displayedMonth = 0; displayedYear++; }
  renderCalendar();
});

function openCalendarModal(id, colType) {
  currentCalendarDocId = id;
  currentCalendarCollection = colType;
  
  const arr = colType === "apartments" ? currentApartments : currentRooms;
  const item = arr.find(a => a.id === id);
  calAptName.textContent = item.name;
  
  tempBlockedDates = new Set(item.blockedDates || []);
  
  displayedMonth = new Date().getMonth();
  displayedYear = new Date().getFullYear();
  
  renderCalendar();
  calendarModal.classList.add('active');
}

function renderCalendar() {
  calendarGrid.innerHTML = '';
  
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  currentMonthYear.textContent = `${monthNames[displayedMonth]} ${displayedYear}`;

  const firstDay = new Date(displayedYear, displayedMonth, 1).getDay();
  const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
  
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Lundi = 0
  for (let i = 0; i < offset; i++) {
    const emptyDiv = document.createElement('div');
    calendarGrid.appendChild(emptyDiv);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';
    dayDiv.textContent = d;
    
    const dateStr = `${displayedYear}-${String(displayedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    if (tempBlockedDates.has(dateStr)) {
      dayDiv.classList.add('blocked');
    }
    
    dayDiv.addEventListener('click', () => {
      if (tempBlockedDates.has(dateStr)) {
        tempBlockedDates.delete(dateStr);
        dayDiv.classList.remove('blocked');
      } else {
        tempBlockedDates.add(dateStr);
        dayDiv.classList.add('blocked');
      }
    });

    calendarGrid.appendChild(dayDiv);
  }
}

// Bloquer tout le mois
blockAllBtn.addEventListener('click', () => {
  const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${displayedYear}-${String(displayedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    tempBlockedDates.add(dateStr);
  }
  renderCalendar();
});

// Débloquer tout
unblockAllBtn.addEventListener('click', () => {
  tempBlockedDates.clear();
  renderCalendar();
});

saveDatesBtn.addEventListener('click', async () => {
  if (!currentCalendarDocId || !currentCalendarCollection) return;
  saveDatesBtn.disabled = true;
  saveDatesBtn.textContent = "Sauvegarde...";

  try {
    await updateDoc(doc(db, currentCalendarCollection, currentCalendarDocId), {
      blockedDates: Array.from(tempBlockedDates)
    });
    
    const arr = currentCalendarCollection === "apartments" ? currentApartments : currentRooms;
    const item = arr.find(a => a.id === currentCalendarDocId);
    if(item) item.blockedDates = Array.from(tempBlockedDates);
    
    calendarModal.classList.remove('active');
  } catch (error) {
    alert("Erreur lors de la sauvegarde : " + error.message);
  } finally {
    saveDatesBtn.disabled = false;
    saveDatesBtn.textContent = "Sauvegarder les dates";
  }
});

// Importation depuis data.js
const importBtn = document.getElementById('import-btn');
if (importBtn) {
  importBtn.addEventListener('click', async () => {
    const logementsToImport = [
      { id: "app-1", type: "appartement", titre: "Appartement 1", description: "Appartement luxueux, propre et moderne, parfait pour vacances ou travail.", image: "Images/apt10.png" },
      { id: "app-2", type: "appartement", titre: "Appartement 2", description: "Appartement moderne et confortable, proche du centre avec équipements complets.", image: "Images/apt10.png" },
      { id: "app-3", type: "appartement", titre: "Appartement 3", description: "Appartement élégant et bien équipé, parfait pour courts et longs séjours.", image: "Images/apt10.png" },
      { id: "app-4", type: "appartement", titre: "Appartement 4", description: "Appartement haut standing avec design moderne.", image: "Images/apt10.png" },
      { id: "app-5", type: "appartement", titre: "Appartement 5", description: "Appartement calme et propre, idéal pour vacances en famille.", image: "Images/apt10.png" },
      { id: "app-6", type: "appartement", titre: "Appartement 6", description: "Appartement deluxe avec équipements premium.", image: "Images/apt10.png" },
      { id: "app-7", type: "appartement", titre: "Appartement 7", description: "Appartement élégant et confortable.", image: "Images/apt10.png" },
      { id: "app-8", type: "appartement", titre: "Appartement 8", description: "Appartement proche de la mer.", image: "Images/apt10.png" },
      { id: "app-9", type: "appartement", titre: "Appartement 9", description: "Appartement spacieux dans quartier calme.", image: "Images/apt10.png" },
      { id: "app-10", type: "appartement", titre: "Appartement 10", description: "Appartement VIP design luxe.", image: "Images/apt10.png" },
      { id: "ch-1", type: "chambre", titre: "Chambre 1", description: "Chambre propre et moderne.", image: "Images/chambre1-1.jpg" },
      { id: "ch-2", type: "chambre", titre: "Chambre 2", description: "Chambre confortable et calme.", image: "Images/chambre1-1.jpg" },
      { id: "ch-3", type: "chambre", titre: "Chambre 3", description: "Chambre luxe élégante.", image: "Images/chambre1-1.jpg" },
      { id: "ch-4", type: "chambre", titre: "Chambre 4", description: "Chambre VIP premium.", image: "Images/chambre1-1.jpg" },
      { id: "ch-5", type: "chambre", titre: "Chambre 5", description: "Chambre proche plage.", image: "Images/chambre1-1.jpg" },
      { id: "ch-6", type: "chambre", titre: "Chambre 6", description: "Chambre moderne propre.", image: "Images/chambre1-1.jpg" },
      { id: "ch-7", type: "chambre", titre: "Chambre 7", description: "Chambre deluxe confortable.", image: "Images/chambre1-1.jpg" }
    ];

    if (!confirm(`Voulez-vous importer ${logementsToImport.length} logements vers Firebase ?`)) return;
    
    importBtn.disabled = true;
    importBtn.textContent = "Importation en cours...";
    
    try {
      let count = 0;
      for (const log of logementsToImport) {
        const colType = log.type === 'chambre' ? 'rooms' : 'apartments';
        const data = {
          name: log.titre,
          description: log.description || "",
          price: 500, // Prix par défaut
          maxGuests: colType === 'rooms' ? 2 : 4, // Capacité par défaut
          image: log.image || "",
          blockedDates: []
        };
        await addDoc(collection(db, colType), data);
        count++;
      }
      alert(`Succès ! ${count} logements ont été importés.`);
      loadAllData();
    } catch(err) {
      alert("Erreur lors de l'importation: " + err.message);
    } finally {
      importBtn.disabled = false;
      importBtn.textContent = "Importer data.js";
    }
  });
}
