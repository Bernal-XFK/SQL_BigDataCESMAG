import re

def test_no_select_star():
    sql = open("../estudiantes/andres/tarea-01-clientes/Andres_Clientes-Gam.sql").read()
    assert "SELECT" in sql.upper(), "El .sql debe contener SELECT"

def test_no_destructive():
    sql = open("../estudiantes/andres/tarea-01-clientes/Andres_Clientes-Gam.sql").read().upper()
    assert "DROP TABLE" not in sql
    assert "TRUNCATE" not in sql
