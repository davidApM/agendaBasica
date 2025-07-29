document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let tareas = JSON.parse(localStorage.getItem('tareas')) || [];
    const modoGuardado = localStorage.getItem('modo');
    const modoOscuro = modoGuardado === 'oscuro';
    
    // Elementos del DOM
    const body = document.body;
    const botonModo = document.getElementById('modo-toggle');
    const formulario = document.querySelector('.form-contacto');
    const tablaTareas = document.querySelector('.tabla-tareas tbody');
    const filtroEstado = document.getElementById('filtro-estado');
    const filtroPrioridad = document.getElementById('filtro-prioridad');
    const busquedaTitulo = document.getElementById('busqueda-titulo');
    const limpiarFiltros = document.getElementById('limpiar-filtros');
    const btnEnviar = document.getElementById('enviar-formulario');

    // Inicialización del modo oscuro/claro
    if (modoOscuro) {
        body.classList.add('modo-oscuro');
        botonModo.textContent = '☀️ Modo claro';
    }

    // Cargar tareas iniciales
    cargarTareasIniciales();
    renderizarTareas(tareas);

    // Event Listeners
    botonModo.addEventListener('click', toggleModo);
    formulario.addEventListener('submit', manejarEnvioFormulario);
    filtroEstado.addEventListener('change', filtrarTareas);
    filtroPrioridad.addEventListener('change', filtrarTareas);
    busquedaTitulo.addEventListener('input', filtrarTareas);
    limpiarFiltros.addEventListener('click', limpiarFiltrosHandler);

    // Función para cambiar entre modo oscuro/claro
    function toggleModo() {
        body.classList.toggle('modo-oscuro');
        const modo = body.classList.contains('modo-oscuro') ? 'oscuro' : 'claro';
        localStorage.setItem('modo', modo);
        botonModo.textContent = modo === 'oscuro' ? '☀️ Modo claro' : '🌙 Modo oscuro';
        mostrarNotificacion(`Modo ${modo} activado`);
    }

    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo = 'exito') {
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        
        const iconos = {
            'error': '<i class="fas fa-times-circle"></i>',
            'advertencia': '<i class="fas fa-exclamation-triangle"></i>',
            'exito': '<i class="fas fa-check-circle"></i>'
        };
        
        notificacion.innerHTML = `
            <span class="notificacion-icono">${iconos[tipo] || iconos.exito}</span>
            <span class="notificacion-mensaje">${mensaje}</span>
            <span class="cerrar">&times;</span>
        `;
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => notificacion.classList.add('mostrar'), 100);
        
        // Cerrar notificación
        notificacion.querySelector('.cerrar').addEventListener('click', () => {
            cerrarNotificacion(notificacion);
        });
        
        // Auto-cierre después de 5 segundos
        setTimeout(() => cerrarNotificacion(notificacion), 5000);
    }

    function cerrarNotificacion(notificacion) {
        if (notificacion.parentNode) {
            notificacion.classList.remove('mostrar');
            setTimeout(() => notificacion.remove(), 300);
        }
    }

    // Funciones del CRUD
    function manejarEnvioFormulario(e) {
        e.preventDefault();
        
        const datosFormulario = obtenerDatosFormulario();
        
        if (!validarFormulario(datosFormulario)) {
            mostrarNotificacion('Por favor complete todos los campos obligatorios', 'error');
            return;
        }
        
        const estaEditando = btnEnviar.dataset.editingId;
        
        if (estaEditando) {
            actualizarTarea(parseInt(estaEditando), datosFormulario);
        } else {
            crearTarea(datosFormulario);
        }
        
        formulario.reset();
        document.getElementById('ver-tarea').scrollIntoView({ behavior: 'smooth' });
    }

    function obtenerDatosFormulario() {
        return {
            titulo: document.getElementById('titulo').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim(),
            fechaLimite: document.getElementById('fecha_limite').value,
            prioridad: document.querySelector('input[name="prioridad"]:checked')?.value
        };
    }

    function validarFormulario({ titulo, descripcion, fechaLimite, prioridad }) {
        return titulo && descripcion && fechaLimite && prioridad;
    }

    function crearTarea({ titulo, descripcion, fechaLimite, prioridad }) {
        const nuevaTarea = {
            id: Date.now(),
            titulo,
            descripcion,
            fechaLimite: formatearFecha(fechaLimite),
            prioridad,
            estado: 'Pendiente',
            fechaCreacion: new Date().toISOString()
        };
        
        tareas.push(nuevaTarea);
        guardarTareas();
        renderizarTareas(tareas);
        mostrarNotificacion('Tarea creada con éxito', 'exito');
    }

    function actualizarTarea(id, { titulo, descripcion, fechaLimite, prioridad }) {
        const tareaIndex = tareas.findIndex(t => t.id === id);
        
        if (tareaIndex !== -1) {
            tareas[tareaIndex] = {
                ...tareas[tareaIndex],
                titulo,
                descripcion,
                fechaLimite: formatearFecha(fechaLimite),
                prioridad
            };
            
            guardarTareas();
            renderizarTareas(tareas);
            mostrarNotificacion('Tarea actualizada con éxito', 'exito');
            btnEnviar.textContent = 'Enviar';
            delete btnEnviar.dataset.editingId;
        }
    }

    function renderizarTareas(tareasAMostrar) {
        tablaTareas.innerHTML = tareasAMostrar.length === 0 
            ? '<tr><td colspan="7" style="text-align: center;">No hay tareas registradas</td></tr>'
            : tareasAMostrar.map(tarea => crearFilaTarea(tarea)).join('');
        
        actualizarContadorTareas(tareasAMostrar.length);
        configurarEventListenersTareas();
    }

    function crearFilaTarea(tarea) {
        return `
            <tr>
                <td>${tarea.id}</td>
                <td>${tarea.titulo}</td>
                <td>${tarea.descripcion}</td>
                <td>${tarea.fechaLimite}</td>
                <td>${tarea.prioridad}</td>
                <td>
                    <select class="estado-tarea" data-id="${tarea.id}">
                        ${['Pendiente', 'En progreso', 'Completado'].map(estado => 
                            `<option value="${estado}" ${tarea.estado === estado ? 'selected' : ''}>${estado}</option>`
                        ).join('')}
                    </select>
                </td>
                <td class="acciones">
                    <button class="editar" data-id="${tarea.id}">✏️ Editar</button>
                    <button class="eliminar" data-id="${tarea.id}">🗑️ Eliminar</button>
                </td>
            </tr>
        `;
    }

    function actualizarContadorTareas(total) {
        document.querySelector('.tabla-tareas tfoot td:last-child').textContent = total;
    }

    function configurarEventListenersTareas() {
        document.querySelectorAll('.eliminar').forEach(btn => {
            btn.addEventListener('click', manejarEliminarTarea);
        });
        
        document.querySelectorAll('.editar').forEach(btn => {
            btn.addEventListener('click', manejarEditarTarea);
        });
        
        document.querySelectorAll('.estado-tarea').forEach(select => {
            select.addEventListener('change', manejarCambioEstado);
        });
    }

    function manejarEliminarTarea(e) {
        const id = parseInt(e.target.dataset.id);
        mostrarConfirmacionEliminacion(id);
    }

    function mostrarConfirmacionEliminacion(id) {
        const confirmacion = document.createElement('div');
        confirmacion.className = 'notificacion advertencia';
        confirmacion.innerHTML = `
            <span class="notificacion-icono"><i class="fas fa-exclamation-triangle"></i></span>
            <div class="notificacion-contenido">
                <span class="notificacion-mensaje">¿Estás seguro de eliminar esta tarea?</span>
                <div class="notificacion-botones">
                    <button id="confirmar-eliminar">Sí, eliminar</button>
                    <button id="cancelar-eliminar">Cancelar</button>
                </div>
            </div>
            <span class="cerrar">&times;</span>
        `;
        
        document.body.appendChild(confirmacion);
        setTimeout(() => confirmacion.classList.add('mostrar'), 100);
        
        // Configurar eventos de los botones
        confirmacion.querySelector('#confirmar-eliminar').addEventListener('click', () => {
            eliminarTarea(id);
            cerrarNotificacion(confirmacion);
        });
        
        confirmacion.querySelector('#cancelar-eliminar').addEventListener('click', () => {
            cerrarNotificacion(confirmacion);
        });
        
        confirmacion.querySelector('.cerrar').addEventListener('click', () => {
            cerrarNotificacion(confirmacion);
        });
    }

    function eliminarTarea(id) {
        tareas = tareas.filter(tarea => tarea.id !== id);
        guardarTareas();
        renderizarTareas(tareas);
        mostrarNotificacion('Tarea eliminada correctamente', 'exito');
    }

    function manejarEditarTarea(e) {
        const id = parseInt(e.target.dataset.id);
        const tarea = tareas.find(t => t.id === id);
        
        if (tarea) {
            document.getElementById('titulo').value = tarea.titulo;
            document.getElementById('descripcion').value = tarea.descripcion;
            document.getElementById('fecha_limite').value = tarea.fechaLimite.split('/').reverse().join('-');
            document.querySelector(`input[name="prioridad"][value="${tarea.prioridad.toLowerCase()}"]`).checked = true;
            
            btnEnviar.textContent = 'Actualizar Tarea';
            btnEnviar.dataset.editingId = id;
            
            document.getElementById('agregar-tarea').scrollIntoView({ behavior: 'smooth' });
        }
    }

    function manejarCambioEstado(e) {
        const id = parseInt(e.target.dataset.id);
        const nuevoEstado = e.target.value;
        
        const tarea = tareas.find(t => t.id === id);
        if (tarea) {
            tarea.estado = nuevoEstado;
            guardarTareas();
            mostrarNotificacion('Estado de tarea actualizado', 'exito');
        }
    }

    // Funciones de filtrado
    function filtrarTareas() {
        const estado = filtroEstado.value;
        const prioridad = filtroPrioridad.value;
        const textoBusqueda = busquedaTitulo.value.toLowerCase();
        
        let tareasFiltradas = tareas;
        
        if (estado !== 'todos') {
            tareasFiltradas = tareasFiltradas.filter(tarea => 
                estado === 'pendiente' ? tarea.estado === 'Pendiente' :
                estado === 'en-progreso' ? tarea.estado === 'En progreso' :
                tarea.estado === 'Completado'
            );
        }
        
        if (prioridad !== 'todos') {
            tareasFiltradas = tareasFiltradas.filter(tarea => 
                prioridad === 'critica' ? tarea.prioridad === 'Crítica' :
                prioridad === 'alta' ? tarea.prioridad === 'Alta' :
                prioridad === 'media' ? tarea.prioridad === 'Media' :
                tarea.prioridad === 'Baja'
            );
        }
        
        if (textoBusqueda) {
            tareasFiltradas = tareasFiltradas.filter(tarea => 
                tarea.titulo.toLowerCase().includes(textoBusqueda)
            );
        }
        
        renderizarTareas(tareasFiltradas);
    }

    function limpiarFiltrosHandler() {
        filtroEstado.value = 'todos';
        filtroPrioridad.value = 'todos';
        busquedaTitulo.value = '';
        renderizarTareas(tareas);
        mostrarNotificacion('Filtros limpiados correctamente', 'exito');
    }

    // Funciones auxiliares
    function guardarTareas() {
        localStorage.setItem('tareas', JSON.stringify(tareas));
    }

    function formatearFecha(fechaISO) {
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    function cargarTareasIniciales() {
        if (tareas.length === 0) {
            tareas = [
                {
                    id: 101,
                    titulo: 'Reunión equipo',
                    descripcion: 'Preparar presentación para cliente',
                    fechaLimite: '15/05/2023',
                    prioridad: 'Alta',
                    estado: 'Pendiente',
                    fechaCreacion: '2023-05-01T10:00:00Z'
                },
                {
                    id: 102,
                    titulo: 'Informe mensual',
                    descripcion: 'Completar informe de ventas',
                    fechaLimite: '20/05/2023',
                    prioridad: 'Media',
                    estado: 'En progreso',
                    fechaCreacion: '2023-05-05T14:30:00Z'
                },
                {
                    id: 103,
                    titulo: 'Actualizar sistema',
                    descripcion: 'Instalar última versión del software',
                    fechaLimite: '10/05/2023',
                    prioridad: 'Crítica',
                    estado: 'Completado',
                    fechaCreacion: '2023-04-28T09:15:00Z'
                }
            ];
            guardarTareas();
        }
    }
});