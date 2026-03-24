.PHONY: help backend-check miniapp-check full-check demo-up demo-up-fresh demo-smoke demo-down demo-logs

CONTAINER_NAME ?= reairss-demo
BASE_URL ?= http://127.0.0.1:8000

help:
	@printf "Available targets:\n"
	@printf "  make backend-check   Run backend syntax checks\n"
	@printf "  make miniapp-check   Run miniapp JS syntax checks\n"
	@printf "  make full-check      Run backend + miniapp syntax checks\n"
	@printf "  make demo-up         Start demo backend with existing demo data\n"
	@printf "  make demo-up-fresh   Start demo backend from a fresh SQLite file\n"
	@printf "  make demo-smoke      Run the demo smoke checks against BASE_URL\n"
	@printf "  make demo-logs       Tail logs from the demo backend container\n"
	@printf "  make demo-down       Stop and remove the demo backend container\n"

backend-check:
	python3 -m compileall app
	python3 -m py_compile scripts/demo_smoke.py

miniapp-check:
	./scripts/check_miniapp_syntax.sh

full-check: backend-check miniapp-check

demo-up:
	./scripts/run_demo_backend.sh

demo-up-fresh:
	./scripts/run_demo_backend.sh --fresh

demo-smoke:
	python3 scripts/demo_smoke.py --base-url $(BASE_URL)

demo-logs:
	docker logs -f --tail 200 $(CONTAINER_NAME)

demo-down:
	-docker rm -f $(CONTAINER_NAME)
