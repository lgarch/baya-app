 import os
import re

files_to_fix = [
    'about.html', 'appartement1.html', 'chambre1.html', 'contact.html', 
    'details.html', 'faq.html', 'feedback.html', 'terms.html'
]

replacement = """<header class="navbar">
  <div class="logo">Baya Apartment <span>⭐</span></div>

  <nav>
    <ul class="nav-links" id="nav-menu">
      <li><a href="index.html">Accueil</a></li>
      <li class="dropdown">
        <a href="#">Propriétés ▾</a>
        <ul class="dropdown-menu">
          <li><a href="appartements.html">Appartements</a></li>
          <li><a href="chambres.html">Chambres</a></li>
        </ul>
      </li>
      <li><a href="index.html#faq">FAQ</a></li>
      <li><a href="index.html#contact">Contact</a></li>
    </ul>
  </nav>

  <!-- Menu Icon -->
  <div class="menu-icon" onclick="document.getElementById('nav-menu').classList.toggle('active')">
    &#8942;
  </div>
</header>"""

for filename in files_to_fix:
    path = os.path.join(r"c:\Users\ASUS\Desktop\STAYMAROC", filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace the entire <header ...> </header> block
        new_content = re.sub(r'<header class="header">.*?</header>', replacement, content, flags=re.DOTALL)
        
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed {filename}")
        else:
            print(f"No match found in {filename}")
