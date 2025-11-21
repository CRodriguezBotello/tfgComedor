<?php
    /**
     * Modelo de Usuario.
     */
    class Usuario {
        public $id = null;
        public $nombre = null;
        public $apellidos = null;
        public $correo = null;
        public $clave = null;
        public $telefono = null;
        public $dni = null;
        public $iban = null;
        public $titular = null;
        public $rol = null;
        public $tsConexion = null; // Timestamp de conexión
        public $autorizacion = null;
    }
?>