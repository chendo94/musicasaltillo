// Configuración de Firebase (reemplaza con tus propias credenciales)
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
const storage = firebase.storage();

// Agregar el proveedor de Google
const provider = new firebase.auth.GoogleAuthProvider();

function iniciarSesionConGoogle() {
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            // Verificar si el usuario ya existe en la base de datos
            db.collection('usuarios').doc(user.uid).get().then((doc) => {
                if (!doc.exists) {
                    // Si el usuario no existe, crear un nuevo perfil
                    db.collection('usuarios').doc(user.uid).set({
                        email: user.email,
                        tipoUsuario: 'cliente' // Por defecto, se registra como cliente
                    });
                }
            });
            navegarA('perfil');
        })
        .catch((error) => {
            console.error("Error al iniciar sesión con Google:", error);
            alert("Error al iniciar sesión con Google: " + error.message);
        });
}

function navegarA(pagina) {
    const contenido = document.getElementById('contenido-principal');
    switch(pagina) {
        case 'inicio':
            contenido.innerHTML = `
                <section class="hero">
                    <h1>Bienvenido a MúsicaViva</h1>
                    <p>Descubre y contrata los mejores talentos musicales para tus eventos.</p>
                    <a href="#" class="cta-button" onclick="navegarA('registro')">Comienza Ahora</a>
                    <a href="#" class="cta-button" onclick="iniciarSesionConGoogle()">Iniciar sesión con Google</a>
                </section>
                <section class="features">
                    <div class="feature">
                        <h3>Amplia Selección</h3>
                        <p>Encuentra artistas de todos los géneros musicales.</p>
                    </div>
                    <div class="feature">
                        <h3>Fácil de Usar</h3>
                        <p>Interfaz intuitiva para una experiencia sin complicaciones.</p>
                    </div>
                    <div class="feature">
                        <h3>Seguro y Confiable</h3>
                        <p>Transacciones seguras y artistas verificados.</p>
                    </div>
                </section>
                <section class="grupos-registrados">
                    <h2>Grupos Registrados</h2>
                    <div id="lista-grupos"></div>
                </section>
            `;
            fetchGrupos();
            break;
        case 'registro':
            contenido.innerHTML = `
                <div class="form-container">
                    <h2>Registro</h2>
                    <input type="email" id="email" placeholder="Correo electrónico">
                    <input type="password" id="password" placeholder="Contraseña">
                    <select id="tipo-usuario">
                        <option value="cliente">Cliente</option>
                        <option value="musico">Músico/Grupo</option>
                    </select>
                    <button onclick="registrar()">Registrarse</button>
                    <button onclick="iniciarSesionConGoogle()">Iniciar sesión con Google</button>
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
                                        <input type="text" id="nombre-grupo" placeholder="Nombre del grupo" value="${userData.nombreGrupo || ''}">
                                        <input type="text" id="genero-musical" placeholder="Género musical" value="${userData.generoMusical || ''}">
                                        <textarea id="descripcion" placeholder="Descripción">${userData.descripcion || ''}</textarea>
                                        <input type="file" id="imagen-perfil" accept="image/*">
                                        <button onclick="actualizarPerfilMusico()">Actualizar Perfil</button>
                                    ` : ''}
                                    <button onclick="cerrarSesion()">Cerrar Sesión</button>
                                </div>
                            `;
                        }
                    });
                } else {
                    contenido.innerHTML = `
                        <div class="form-container">
                            <h2>Perfil de Usuario</h2>
                            <p>Por favor, inicia sesión para ver tu perfil.</p>
                            <button onclick="navegarA('registro')">Ir a Registro</button>
                        </div>
                    `;
                }
            });
            break;
        case 'buscar-musicos':
            contenido.innerHTML = `
                <div class="search-container">
                    <h2>Buscar Músicos</h2>
                    <input type="text" id="busqueda" placeholder="Buscar por género o nombre">
                    <button onclick="buscarMusicos()">Buscar</button>
                    <div id="resultados-busqueda"></div>
                </div>
            `;
            break;
        case 'calendario':
            contenido.innerHTML = `
                <h2>Calendario de Disponibilidad</h2>
                <div id="calendario"></div>
            `;
            inicializarCalendario();
            break;
    }
}

function registrar() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const tipoUsuario = document.getElementById('tipo-usuario').value;
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return db.collection('usuarios').doc(user.uid).set({
                email: email,
                tipoUsuario: tipoUsuario
            });
        })
        .then(() => {
            console.log("Usuario registrado y perfil creado");
            navegarA('perfil');
        })
        .catch((error) => {
            console.error("Error en el registro:", error);
            alert("Error en el registro: " + error.message);
        });
}

function actualizarPerfilMusico() {
    const user = auth.currentUser;
    if (user) {
        const nombreGrupo = document.getElementById('nombre-grupo').value;
        const generoMusical = document.getElementById('genero-musical').value;
        const descripcion = document.getElementById('descripcion').value;
        const imagenPerfil = document.getElementById('imagen-perfil').files[0];

        if (imagenPerfil) {
            const storageRef = firebase.storage().ref();
            const imagenRef = storageRef.child(`imagenes-perfil/${user.uid}/${imagenPerfil.name}`);
            imagenRef.put(imagenPerfil).then((snapshot) => {
                snapshot.ref.getDownloadURL().then((url) => {
                    db.collection('usuarios').doc(user.uid).update({
                        nombreGrupo: nombreGrupo,
                        generoMusical: generoMusical,
                        descripcion: descripcion,
                        imagenPerfil: url
                    }).then(() => {
                        console.log("Perfil actualizado");
                        alert("Perfil actualizado con éxito");
                    }).catch((error) => {
                        console.error("Error al actualizar el perfil:", error);
                        alert("Error al actualizar el perfil: " + error.message);
                    });
                });
            }).catch((error) => {
                console.error("Error al subir la imagen:", error);
                alert("Error al subir la imagen: " + error.message);
            });
        } else {
            db.collection('usuarios').doc(user.uid).update({
                nombreGrupo: nombreGrupo,
                generoMusical: generoMusical,
                descripcion: descripcion
            }).then(() => {
                console.log("Perfil actualizado");
                alert("Perfil actualizado con éxito");
            }).catch((error) => {
                console.error("Error al actualizar el perfil:", error);
                alert("Error al actualizar el perfil: " + error.message);
            });
        }
    }
}

function buscarMusicos() {
    const busqueda = document.getElementById('busqueda').value.toLowerCase();
    db.collection('usuarios').where('tipoUsuario', '==', 'musico').get()
        .then((querySnapshot) => {
            let resultadosHTML = '';
            querySnapshot.forEach((doc) => {
                const musico = doc.data();
                if (musico.nombreGrupo.toLowerCase().includes(busqueda) || 
                    musico.generoMusical.toLowerCase().includes(busqueda)) {
                    resultadosHTML += `
                        <div class="resultado-musico">
                            <h3>${musico.nombreGrupo}</h3>
                            <p>Género: ${musico.generoMusical}</p>
                            <p>${musico.descripcion}</p>
                            <button onclick="mostrarPerfilMusico('${doc.id}')">Ver Perfil</button>
                        </div>
                    `;
                }
            });
            document.getElementById('resultados-busqueda').innerHTML = resultadosHTML;
        })
        .catch((error) => {
            console.error("Error en la búsqueda:", error);
            alert("Error en la búsqueda: " + error.message);
        });
}

function cerrarSesion() {
    auth.signOut().then(() => {
        console.log("Sesión cerrada");
        navegarA('inicio');
    }).catch((error) => {
        console.error("Error al cerrar sesión:", error);
    });
}

function inicializarCalendario() {
    var calendarEl = document.getElementById('calendario');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [], // Aquí cargaríamos los eventos desde Firebase
        selectable: true,
        select: function(info) {
            // Aquí manejaríamos la selección de fechas para marcar disponibilidad
            alert('Seleccionado ' + info.startStr + ' a ' + info.endStr);
        }
    });
    calendar.render();
}

function mostrarPerfilMusico(musicoId) {
    db.collection('usuarios').doc(musicoId).get().then(doc => {
        if (doc.exists) {
            const musico = doc.data();
            const contenido = document.getElementById('contenido-principal');
            contenido.innerHTML = `
                <h2>${musico.nombreGrupo}</h2>
                <p>Género: ${musico.generoMusical}</p>
                <p>${musico.descripcion}</p>
                ${musico.imagenPerfil ? `<img src="${musico.imagenPerfil}" alt="Imagen de perfil">` : ''}
                <div class="calendar-container">
                    <h3>Disponibilidad</h3>
                    <div id="calendario-musico"></div>
                </div>
                <div class="reviews-container">
                    <h3>Reseñas</h3>
                    <div id="lista-resenas"></div>
                    <button onclick="mostrarFormularioResena('${musicoId}')">Dejar Reseña</button>
                </div>
                <div class="messages-container">
                    <h3>Mensajes</h3>
                    <div id="lista-mensajes"></div>
                    <button onclick="mostrarFormularioMensaje('${musicoId}')">Enviar Mensaje</button>
                </div>
            `;
            inicializarCalendarioMusico(musicoId);
            cargarResenas(musicoId);
            cargarMensajes(musicoId);
        }
    });
}

function inicializarCalendarioMusico(musicoId) {
    var calendarEl = document.getElementById('calendario-musico');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: [], // Cargar eventos desde Firebase
    });
    calendar.render();
}

function cargarResenas(musicoId) {
    db.collection('resenas').where('musicoId', '==', musicoId).get().then(querySnapshot => {
        let resenasHTML = '';
        querySnapshot.forEach(doc => {
            const resena = doc.data();
            resenasHTML += `
                <div class="review">
                    <div class="star-rating">${'★'.repeat(resena.calificacion)}${'☆'.repeat(5-resena.calificacion)}</div>
                    <p>${resena.comentario}</p>
                    <small>Por: ${resena.nombreCliente}</small>
                </div>
            `;
        });
        document.getElementById('lista-resenas').innerHTML = resenasHTML;
    });
}

function mostrarFormularioResena(musicoId) {
    const contenido = document.getElementById('contenido-principal');
    contenido.innerHTML += `
        <div class="form-container">
            <h3>Dejar Reseña</h3>
            <select id="calificacion">
                <option value="1">1 estrella</option>
                <option value="2">2 estrellas</option>
                <option value="3">3 estrellas</option>
                <option value="4">4 estrellas</option>
                <option value="5">5 estrellas</option>
            </select>
            <textarea id="comentario" placeholder="Escribe tu reseña aquí"></textarea>
            <button onclick="enviarResena('${musicoId}')">Enviar Reseña</button>
        </div>
    `;
}

function enviarResena(musicoId) {
    const calificacion = document.getElementById('calificacion').value;
    const comentario = document.getElementById('comentario').value;
    const user = auth.currentUser;

    if (user) {
        db.collection('resenas').add({
            musicoId: musicoId,
            clienteId: user.uid,
            nombreCliente: user.displayName || user.email,
            calificacion: parseInt(calificacion),
            comentario: comentario,
            fecha: new Date()
        }).then(() => {
            alert('Reseña enviada con éxito');
            mostrarPerfilMusico(musicoId);
        }).catch(error => {
            console.error("Error al enviar la reseña:", error);
            alert("Error al enviar la reseña: " + error.message);
        });
    } else {
        alert('Debes iniciar sesión para dejar una reseña');
    }
}

function mostrarFormularioMensaje(musicoId) {
    const contenido = document.getElementById('contenido-principal');
    contenido.innerHTML += `
        <div class="form-container">
            <h3>Enviar Mensaje</h3>
            <textarea id="mensaje" placeholder="Escribe tu mensaje aquí"></textarea>
            <button onclick="enviarMensaje('${musicoId}')">Enviar Mensaje</button>
        </div>
    `;
}

function enviarMensaje(musicoId) {
    const mensaje = document.getElementById('mensaje').value;
    const user = auth.currentUser;

    if (user) {
        db.collection('mensajes').add({
            musicoId: musicoId,
            clienteId: user.uid,
            nombreCliente: user.displayName || user.email,
            mensaje: mensaje,
            fecha: new Date()
        }).then(() => {
            alert('Mensaje enviado con éxito');
            mostrarPerfilMusico(musicoId);
        }).catch(error => {
            console.error("Error al enviar el mensaje:", error);
            alert("Error al enviar el mensaje: " + error.message);
        });
    } else {
        alert('Debes iniciar sesión para enviar un mensaje');
    }
}

function cargarMensajes(musicoId) {
    db.collection('mensajes').where('musicoId', '==', musicoId).get().then(querySnapshot => {
        let mensajesHTML = '';
        querySnapshot.forEach(doc => {
            const mensaje = doc.data();
            mensajesHTML += `
                <div class="mensaje">
                    <p>${mensaje.mensaje}</p>
                    <small>Por: ${mensaje.nombreCliente} - ${mensaje.fecha.toDate().toLocaleString()}</small>
                </div>
            `;
        });
        document.getElementById('lista-mensajes').innerHTML = mensajesHTML;
    });
}

function fetchGrupos() {
    db.collection('usuarios').where('tipoUsuario', '==', 'musico').get()
        .then((querySnapshot) => {
            let gruposHTML = '';
            querySnapshot.forEach((doc) => {
                const grupo = doc.data();
                gruposHTML += `
                    <div class="grupo">
                        <h3>${grupo.nombreGrupo}</h3>
                        <p>${grupo.descripcion}</p>
                        <p>Género: ${grupo.generoMusical}</p>
                        <p>Contacto: <a href="mailto:${grupo.email}">${grupo.email}</a></p>
                        ${grupo.imagenPerfil ? `<img src="${grupo.imagenPerfil}" alt="Imagen de perfil">` : ''}
                        <button onclick="mostrarPerfilMusico('${doc.id}')">Ver Perfil</button>
                    </div>
                `;
            });
            document.getElementById('lista-grupos').innerHTML = gruposHTML;
        })
        .catch((error) => {
            console.error("Error al obtener los grupos:", error);
            alert("Error al obtener los grupos: " + error.message);
        });
}

// Cargar la página de inicio por defecto
navegarA('inicio');
