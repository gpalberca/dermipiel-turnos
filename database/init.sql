-- Tabla de tratamientos
CREATE TABLE IF NOT EXISTS tratamientos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  duracion_minutos INT NOT NULL,
  precio DECIMAL(10,2)
);

-- Tabla de citas
CREATE TABLE IF NOT EXISTS citas (
  id SERIAL PRIMARY KEY,
  nombre_paciente VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  telefono VARCHAR(20),
  tratamiento_id INT REFERENCES tratamientos(id),
  fecha_hora TIMESTAMP NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Datos iniciales de tratamientos
INSERT INTO tratamientos (nombre, descripcion, duracion_minutos, precio) VALUES
  ('Depilación Láser', 'Eliminación permanente del vello con tecnología de diodo', 60, 80.00),
  ('Láser CO₂ Fraccionado', 'Rejuvenecimiento profundo, eliminación de cicatrices y manchas', 90, 150.00),
  ('Despigmentación de Cejas', 'Eliminación precisa de micropigmentación y tatuajes de cejas', 45, 120.00),
  ('HydraFacial', 'Limpieza, exfoliación, extracción e hidratación intensiva', 60, 100.00);
