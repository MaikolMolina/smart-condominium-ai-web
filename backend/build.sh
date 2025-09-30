#!/usr/bin/env bash
set -o errexit  # Detenerse si hay un error

# 1️⃣ Instalar dependencias desde requirements.txt en la raíz
pip install -r ../requirements.txt

# Moverse al backend
cd backend

# 2️⃣ Recolectar archivos estáticos de Django
python manage.py collectstatic --no-input

# 3️⃣ Aplicar migraciones
python manage.py migrate