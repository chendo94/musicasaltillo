// Configuración de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_DOMINIO.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET.appspot.com",
    messagingSenderId: "TU_MESSAGING_ID",
    appId: "TU_APP_ID"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

function navegarA(pagina) {
    const contenido = document.getElementById('contenido-principal');
    switch (pagina) {
        case 'inicio':
            contenido.innerHTML = `
                <div id="mapa" style="width: 100%; height: 400px;"></div>
                <button class="cta-button" onclick="solicitarGrupo()">Solicitar Grupo</button>
                <button class="cta-button" onclick="cerrarSesion()">Cerrar Sesión</button>
            `;
            cargarMapa();
            break;
        case 'registro':
            contenido.innerHTML = `
                <div class="form-container">
                    <h2>Registro</h2>
                    <p>Selecciona tu tipo de cuenta:</p>
                    <button class="cta-button" onclick="mostrarFormularioRegistro('cliente')">Cliente</button>
                    <button class="cta-button" onclick="mostrarFormularioRegistro('musico')">Músico</button>
                </div>
            `;
            break;
        case 'perfil':
            auth.onAuthStateChanged(user => {
                if (user) {
                    db.collection('usuarios').doc(user.uid).get().then(doc => {
                        const userData = doc.data();
                        contenido.innerHTML = `
                            <h2>Perfil</h2>
                            <p>Nombre: ${userData.tipoUsuario === 'musico' ? userData.nombreGrupo : user.email}</p>
                            <p>Tipo: ${userData.tipoUsuario}</p>
                            <button onclick="cerrarSesion()">Cerrar Sesión</button>
                        `;
                    });
                } else {
                    navegarA('registro');
                }
            });
            break;
    }
}

function cargarMapa() {
    const mapa = new google.maps.Map(document.getElementById('mapa'), {
        center: { lat: 25.4234, lng: -100.9936 },
        zoom: 13
    });

    db.collection('usuarios').where('tipoUsuario', '==', 'musico').get().then(snapshot => {
        snapshot.forEach(doc => {
            const musico = doc.data();
            new google.maps.Marker({
                position: { lat: musico.lat, lng: musico.lng },
                map: mapa,
                title: musico.nombreGrupo
            });
        });
    });
}

function iniciarSesionConGoogle() {
    auth.signInWithPopup(provider)
        .then(result => {
            const user = result.user;
            db.collection('usuarios').doc(user.uid).get().then(doc => {
                if (!doc.exists) {
                    navegarA('registro');
                } else {
                    navegarA('inicio');
                }
            });
        })
        .catch(error => {
            console.error("Error al iniciar sesión con Google:", error);
        });
}

function mostrarFormularioRegistro(tipoUsuario) {
    const contenido = document.getElementById('contenido-principal');
    contenido.innerHTML = `
        <div class="form-container">
            <h2>Registro de ${tipoUsuario === 'musico' ? 'Músico' : 'Cliente'}</h2>
            <input type="email" id="email" placeholder="Correo">
            <input type="password" id="password" placeholder="Contraseña">
            ${tipoUsuario === 'musico' ? `
                <input type="text" id="nombre-grupo" placeholder="Nombre del Grupo">
            ` : ''}
            <button onclick="registrar('${tipoUsuario}')">Registrar</button>
            <button onclick="navegarA('inicio')">Cancelar</button>
        </div>
    `;
}

function registrar(tipoUsuario) {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const nombreGrupo = tipoUsuario === 'musico' ? document.getElementById('nombre-grupo').value : null;

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            return db.collection('usuarios').doc(user.uid).set({
                email,
                tipoUsuario,
                ...(nombreGrupo ? { nombreGrupo } : {})
            });
        })
        .then(() => {
            alert("Registro exitoso");
            navegarA('inicio');
        })
        .catch(error => console.error("Error en el registro:", error));
}

function cerrarSesion() {
    auth.signOut().then(() => navegarA('inicio')).catch(error => console.error("Error al cerrar sesión:", error));
}
