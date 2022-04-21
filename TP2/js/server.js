// Configuration du serveur et des modules

const express = require('express');
const app = express();

const session = require('express-session');
const mariadb = require('mariadb');
const db = mariadb.createPool({
  host: '127.0.0.1',
  user: 'root',
  database: 'sio_chat',
});

let InfoUser;

const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

var path = require("path");
const PORT = 2893;
var msg = [];

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Serveur d'écoute en utilisant un console log en précisant que le serveur est démarré

server.listen(PORT, () => {
  console.log('Serveur démarré sur le port : ' + PORT);
});

//Gestion des routes vers les différents fichiers

app.get('/salon', (req, res) => {
  if(req.session.loggedin) {
    res.sendFile(path.join(__dirname, '..', '/index.html'));
  } else {
    res.send("Erreur ! Accès non autorisé !");
  }
  console.log(req.sessionID);
  console.log(req.session);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '/login.html'));
});

app.get('/client.js',(req, res) => {
  res.sendFile(__dirname + '/client.js');
});

app.get('/bootstrap.min.js', (req, res) => {
  res.sendFile(__dirname +'bootstrap.min.js');
}); 

app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'css/style.css'));
});

app.get('/bootstrap.min.css', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'css/bootstrap.min.css'));
});

app.get('/Login-Form-Basic.css', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'css/Login-Form-Basic.css'));
});

app.get('/loginstyle.css'), (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'css/loginstyle.css'));
}

//Gestionnaire d'évènement pour le Socket ainsi que la connexion du salon


app.post('/login', async(req, res) => {
  const conn = await db.getConnection();
  const sql = "SELECT * FROM user WHERE pseudo = ? AND password = ?";
  const rows = await conn.query(sql, [req.body.pseudo, req.body.password]);
  await conn.end();
  console.log(req.body.pseudo);

  if(rows.length > 0) {
    InfoUser = {
      mail: rows[0].mail,
      pseudo: rows[0].pseudo,
    };
    req.session.loggedin = true;
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  } else {
    res.send("Erreur ! Impossible de vous connectez votre Identifiant ou votre E-mail est incorrect !");
  }
});

io.on('connection',(socket) => {

  // Socket de saisie du pseudo
    console.log(InfoUser.pseudo + " vient de se connecter à " + new Date());
    socket.pseudo = InfoUser.pseudo;
    affuser();
  
// Fonction Affuser permettant la récupération de la liste des utilisateurs

  function affuser() {
    io.fetchSockets().then((room) => {
      var utilisateur = [{id_user: 'salon', pseudo_client:'Salon'}];
      room.forEach((item) => {
        utilisateur.push({
          client_id : item.id,
          pseudo_client : item.pseudo
        });
      }); 
      io.emit('get-pseudo', utilisateur)
    });
    io.emit('msg', msg);
  }

  // Socket Permettant l'émission des messages ainsi que la reception de message

  socket.on('emission_message',(Message, id) => {
    console.log(id);
    console.log(socket.pseudo + " a envoyé " + Message + " à " + new Date());
    var Message = {
      emet_id: socket.id, // ID du client Socket Emetteur du Message
      dest_ID: id, // ID du client Socket Destinataire du Message
      pseudo: socket.pseudo, //Pseudo du client Emetteur
      msg: Message, // Contenu du Message
      recu: false // Variable d'accusé de réceptions
    }

    if (id === "Salon") {
      io.emit('reception_message', Message);
    } else {
      io.to(id).to(socket.id).emit('reception_message', Message);
    }
  });

  // Console Log affichant la déconnexion de l'Utilisateur

  socket.on('disconnect',() => {
    console.log(socket.nickname + " s'est déconnecté à " + new Date());
    affuser();
  });

});

