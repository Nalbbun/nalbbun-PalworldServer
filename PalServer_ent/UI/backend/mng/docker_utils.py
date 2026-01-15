import json
from mng.com import run_cmd


def is_instance_running(name: str) -> bool:
    out = run_cmd(f"docker inspect -f '{{{{.State.Running}}}}' {name} 2>/dev/null")
    return out.strip() == "true"


def is_instance_status(name: str) -> bool:
    out = run_cmd(
        "docker ps --format '{{.Names}}' " f"| awk '$1 == \"{name}\" {{print}}'"
    )
    return out.strip()


def is_instance_resource(name: str):
    out = run_cmd(
        "docker stats --no-stream --format "
        "'{{.Name}} {{.CPUPerc}} {{.MemUsage}}' "
        f"| awk '$1 == \"{name}\" {{print}}'"
    )
    return out.strip()


def is_instance_state(name: str):
    # 상태 / 업타임
    ps = run_cmd(
        "docker ps --filter "
        f"'name=^{name}$' "
        "--format '{{.Status}}|{{.RunningFor}}'"
    ).strip()

    if not ps:
        return ""

    status, running_for = ps.split("|", 1)

    # 포트는 inspect로
    inspect = run_cmd(f"docker inspect {name}")
    data = json.loads(inspect)[0]

    ports = []
    port_map = data["NetworkSettings"]["Ports"] or {}
    for cport, binds in port_map.items():
        if not binds:
            continue
        for b in binds:
            ports.append(f'{b["HostIp"]}:{b["HostPort"]}->{cport}')

    return f"{status}|{','.join(ports)}|{running_for}"


def is_instance_start(compose: str) -> bool:
    out = run_cmd(f"docker-compose -f {compose} up -d")
    return out.strip()


def is_instance_restart(compose: str) -> bool:
    out = run_cmd(f"docker-compose -f {compose} restart")
    return out.strip()


def is_instance_stop(compose: str) -> bool:
    out = run_cmd(f"docker-compose -f {compose} down")
    return out.strip()


def get_rest_port(instance: str) -> int:
    cmd = "docker inspect " f"{instance} " "--format '{{json .NetworkSettings.Ports}}'"

    out = run_cmd(cmd)
    ports = json.loads(out)

    if "8212/tcp" not in ports or not ports["8212/tcp"]:
        raise RuntimeError("REST port not exposed")

    return int(ports["8212/tcp"][0]["HostPort"])
