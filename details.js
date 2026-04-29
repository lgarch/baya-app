const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const logement = logements.find(item => item.id === id);

const titleEl = document.getElementById("logementTitle");
const villeEl = document.getElementById("logementVille");
const statusEl = document.getElementById("logementStatus");
const titre2El = document.getElementById("logementTitre2");
const descEl = document.getElementById("logementDesc");
const mainImageEl = document.getElementById("mainImage");
const galleryEl = document.getElementById("gallery");

if (!logement) {
  if (titleEl) titleEl.innerText = "Logement introuvable";
} else {
  if (titleEl) titleEl.innerText = logement.titre;
  if (villeEl) villeEl.innerText = logement.ville;
  if (statusEl) statusEl.innerText = logement.status;
  if (titre2El) titre2El.innerText = logement.titre;
  if (descEl) descEl.innerText = logement.description;

  if (mainImageEl) mainImageEl.src = logement.image;

  if (galleryEl) {
    galleryEl.innerHTML = "";

    logement.gallery.forEach(img => {
      const image = document.createElement("img");
      image.src = img;
      image.classList.add("gallery-img");

      image.onclick = () => {
        mainImageEl.src = img;
      };

      galleryEl.appendChild(image);
    });
  }

  const reserverBtnEl = document.getElementById("reserverBtn");
  if (reserverBtnEl) {
    reserverBtnEl.href = `booking-form.html?id=${logement.id}`;
  }
}