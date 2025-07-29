    //Función para el modo claro / oscuro 
    const boton = document.getElementById('modo-toggle');
    const body = document.body;

    const modoGuardado = localStorage.getItem('modo');
    if (modoGuardado === 'oscuro') {
        body.classList.add('modo-oscuro');
        boton.textContent = '☀️ Modo claro';
    }

    boton.addEventListener('click', () => {
        body.classList.toggle('modo-oscuro');
        const modo = body.classList.contains('modo-oscuro') ? 'oscuro' : 'claro';
        localStorage.setItem('modo', modo);
        boton.textContent = modo === 'oscuro' ? '☀️ Modo claro' : '🌙 Modo oscuro';
    });