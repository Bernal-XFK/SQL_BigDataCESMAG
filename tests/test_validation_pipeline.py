import re
import os

FORBIDDEN = re.compile(r"\b(DROP\s+TABLE|DELETE\s+FROM(?!\s+\S+\s+WHERE)|TRUNCATE)\b", re.I)

def simulate_download_sql(sql_content, author, repo_file):
    result = {
        "conf": {"author": author, "repo_file": repo_file},
        "sql": None,
        "status": "SUCCESS",
        "error_message": None,
        "step_failed": None,
    }
    sql_clean = sql_content.strip()
    if not sql_clean:
        result["status"] = "FAILED"
        result["error_message"] = "SQL vacio"
        result["step_failed"] = "download_sql"
        return result
    if FORBIDDEN.search(sql_clean):
        result["status"] = "FAILED"
        result["error_message"] = "SQL bloqueado: DROP/DELETE sin WHERE/TRUNCATE no permitido"
        result["step_failed"] = "download_sql"
        return result
    result["sql"] = sql_clean
    return result

def simulate_dry_run(data):
    if data["status"] == "FAILED":
        return data
    # Limpiar comentarios para inspeccionar comandos SQL reales
    lines = [line for line in data["sql"].splitlines() if not line.strip().startswith("--")]
    cleaned_sql = " ".join(lines).strip().upper()
    
    if not (cleaned_sql.startswith("SELECT") or cleaned_sql.startswith("CREATE") or cleaned_sql.startswith("WITH")):
        data["status"] = "FAILED"
        data["error_message"] = "Error de sintaxis: la consulta no inicia con un comando SQL valido"
        data["step_failed"] = "dry_run"
        return data
    if "SELEC " in cleaned_sql or " FORM " in cleaned_sql:
        data["status"] = "FAILED"
        data["error_message"] = "Syntax error: Expected keyword SELECT or FROM but got typo 'SELEC' / 'FORM'"
        data["step_failed"] = "dry_run"
        return data
    data["estimated_bytes"] = 1024
    return data

def run_tests():
    base_dir = os.path.join(os.path.dirname(__file__), "..", "estudiantes")
    
    # Caso 1: Carlos (Exito)
    carlos_file = os.path.join(base_dir, "carlos", "tarea-01-clientes", "Carlos_Clientes.sql")
    sql_carlos = open(carlos_file, encoding="utf-8-sig").read()
    res1 = simulate_dry_run(simulate_download_sql(sql_carlos, "carlos", "Carlos_Clientes.sql"))
    assert res1["status"] == "SUCCESS", f"Fallo esperado SUCCESS en Carlos pero dio {res1}"
    print("[OK] Caso 1 (Carlos): Aprobado -> Estado: SUCCESS")

    # Caso 2: Maria (Fallo por DROP TABLE)
    maria_file = os.path.join(base_dir, "maria", "tarea-01-clientes", "Maria_ComandoPeligroso.sql")
    sql_maria = open(maria_file, encoding="utf-8-sig").read()
    res2 = simulate_dry_run(simulate_download_sql(sql_maria, "maria", "Maria_ComandoPeligroso.sql"))
    assert res2["status"] == "FAILED", f"Fallo esperado FAILED en Maria"
    assert res2["step_failed"] == "download_sql"
    print(f"[OK] Caso 2 (Maria): Detectado comando no permitido -> Estado: FAILED en {res2['step_failed']} | Error: {res2['error_message']}")

    # Caso 3: Juan (Fallo por Sintaxis)
    juan_file = os.path.join(base_dir, "juan", "tarea-01-clientes", "Juan_ErrorSintaxis.sql")
    sql_juan = open(juan_file, encoding="utf-8-sig").read()
    res3 = simulate_dry_run(simulate_download_sql(sql_juan, "juan", "Juan_ErrorSintaxis.sql"))
    assert res3["status"] == "FAILED", f"Fallo esperado FAILED en Juan"
    assert res3["step_failed"] == "dry_run"
    print(f"[OK] Caso 3 (Juan): Detectado error de sintaxis -> Estado: FAILED en {res3['step_failed']} | Error: {res3['error_message']}")

    print("\n==============================================")
    print("TODOS LOS CASOS DE PRUEBA PASARON EXITOSAMENTE")
    print("==============================================")

if __name__ == "__main__":
    run_tests()
