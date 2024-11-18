// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCdJhqShExKd253olISMM7tXPf371qjHx8",
    authDomain: "appstudio-3f8ce.firebaseapp.com",
    projectId: "appstudio-3f8ce",
    storageBucket: "appstudio-3f8ce.appspot.com",
    messagingSenderId: "968910013298",
    appId: "1:968910013298:web:6f10ae0303ccc6785b93eb"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// Navegación dinámica
function navegarA(pagina) {
    const contenido = document.getElementById('contenido-principal');
    switch (pagina) {
        case 'inicio':
            contenido.innerHTML = `
                <section class="hero">
                    <h1>Bienvenido a Música en Vivo</h1>
                    <p>Descubre y contrata los mejores talentos musicales para tus eventos.</p>
                    <button class="cta-button" onclick="verificarSesion()">Iniciar Sesión</button>
                    <button class="cta-button" onclick="iniciarSesionConGoogle()">Iniciar Sesión con Google</button>
                </section>
            `;
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
                        if (doc.exists) {
                            const userData = doc.data();
                            contenido.innerHTML = `
                                <div class="form-container">
                                    <h2>Perfil de ${userData.tipoUsuario === 'musico' ? 'Músico/Grupo' : 'Cliente'}</h2>
                                    <p>Bienvenido, ${user.email}</p>
                                    ${userData.tipoUsuario === 'musico' ? `
                                        <h3>${userData.nombreGrupo || ''}</h3>
                                        <p>Género: ${userData.generoMusical || ''}</p>
                                        <textarea placeholder="Descripción">${userData.descripcion || ''}</textarea>
                                        <button onclick="actualizarPerfilMusico()">Actualizar Perfil</button>
                                    ` : `
                                        <p>Accede a nuestros servicios exclusivos para clientes.</p>
                                    `}
                                    <button onclick="cerrarSesion()">Cerrar Sesión</button>
                                </div>
                            `;
                        }
                    });
                } else {
                    navegarA('registro');
                }
            });
            break;
        default:
            contenido.innerHTML = `<p>Página no encontrada</p>`;
            break;
    }
}

// Inicio de sesión con Google
function iniciarSesionConGoogle() {
    auth.signInWithPopup(provider)
        .then(result => {
            const user = result.user;
            db.collection('usuarios').doc(user.uid).get().then(doc => {
                if (!doc.exists) {
                    navegarA('registro');
                } else {
                    navegarA('perfil');
                }
            });
        })
        .catch(error => {
            console.error("Error al iniciar sesión con Google:", error);
            alert("Error al iniciar sesión con Google: " + error.message);
        });
}

// Verificar sesión existente
function verificarSesion() {
    auth.onAuthStateChanged(user => {
        if (user) {
            navegarA('perfil');
        } else {
            navegarA('registro');
        }
    });
}

// Mostrar formulario de registro
function mostrarFormularioRegistro(tipoUsuario) {
    const contenido = document.getElementById('contenido-principal');
    contenido.innerHTML = `
        <div class="form-container">
            <h2>Registro de ${tipoUsuario === 'musico' ? 'Músico/Grupo' : 'Cliente'}</h2>
            <input type="email" id="email" placeholder="Correo electrónico">
            <input type="password" id="password" placeholder="Contraseña">
            ${tipoUsuario === 'musico' ? `
                <input type="text" id="nombre-grupo" placeholder="Nombre del grupo">
                <input type="text" id="genero-musical" placeholder="Género musical">
                <textarea id="descripcion" placeholder="Descripción"></textarea>
            ` : ''}
            <button onclick="registrar('${tipoUsuario}')">Registrarse</button>
            <button onclick="navegarA('inicio')">Cancelar</button>
        </div>
    `;
}

// Registro de usuario
function registrar(tipoUsuario) {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const extraData = tipoUsuario === 'musico' ? {
        nombreGrupo: document.getElementById('nombre-grupo').value,
        generoMusical: document.getElementById('genero-musical').value,
        descripcion: document.getElementById('descripcion').value
    } : {};

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            return db.collection('usuarios').doc(user.uid).set({
                email: email,
                tipoUsuario: tipoUsuario,
                ...extraData
            });
        })
        .then(() => {
            alert("Registro exitoso. ¡Bienvenido!");
            navegarA('perfil');
        })
        .catch(error => {
            console.error("Error al registrar:", error);
            alert("Error al registrar: " + error.message);
    
