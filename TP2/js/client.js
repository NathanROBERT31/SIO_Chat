//Instanciation des sockets et des variables

const socket = io();
var id_salon = 'Salon';
var lesMessages = [];
const messages = document.getElementById('messages');
const user = document.getElementById('user');
const form = document.getElementById('form');
const input = document.getElementById('input');

//Permet l'écoute et l'envoie des messages

form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (input.value !== '') {
    socket.emit('emission_message', input.value, id_salon);
    input.value = '';
  }
});

// Socket permettant la réception des messages du côté Client

socket.on('reception_message', (Message) => {
  console.log(Message);
  lesMessages.push({
    pseudo: Message.pseudo,
    message: Message.msg,
    dest_ID: Message.dest_ID,
    emet_id: Message.emet_id,
    recu: Message.recu
  });

  salon(id_salon);
  check_unread();
  window.scrollTo(0, document.body.scrollHeight);
  
});

//Création des variables pour le Salon Général et le Salon Privé

socket.on('get-pseudo', (utilisateur) => {

  user.innerHTML = "";
  var salon_li = document.createElement("li");
  var salon_a = document.createElement("a");

  salon_li.setAttribute("id", id_salon);
  user.appendChild(salon_li).appendChild(salon_a);

  utilisateur.forEach((element) => {
    var li = document.createElement("li");
    var a = document.createElement("a");
    var notification = document.createElement("span");

    a.href = "#";
    a.setAttribute("onclick", "salon('" + element.client_id + "')");

    notification.setAttribute("id", element.client_id);
    notification.setAttribute("class", "badge badge-light");
    
    a.innerHTML = (socket.id !== element.client_id ? element.pseudo_client : null);
    user.appendChild(li).appendChild(a).appendChild(notification);
  });
});

//Affichage des messages en fonction du choix de l'utilisateur:
// - Soit les messages du salon général,
// - Soit les messages d'une conversation privée avec un autre utilisateur

function salon(id) {
  id_salon = id;
  messages.innerHTML = "";
  lesMessages.forEach((contenu) => {
    if (contenu.dest_ID === id_salon || contenu.emet_id === id_salon && contenu.dest_ID !== "Salon") {
      var li = document.createElement("li");
      li.innerHTML = contenu.pseudo + " : " + contenu.message;
      messages.appendChild(li);
      contenu.recu = true;
    }
  });

  if (id_salon !== 'Salon') {
    document.getElementById(id_salon).innerHTML = "";
  }
}

// Vérifie les messages non-lus, puis affiche un badge de notification
// Incrémenté à côté de l'utilisateur en question

function check_unread() {
  var notif = [];
  for(const contenu of lesMessages) {
    if(contenu.dest_ID !== 'salon' && contenu.recu === false) {
      if(notif[contenu.dest_ID] === undefined) {
        notif[contenu.dest_ID] = 0;
      }

      notif[contenu.dest_ID]++;
      document.getElementById(contenu.emet_id).innerHTML=notif[contenu.dest_ID]
    }
  }
}