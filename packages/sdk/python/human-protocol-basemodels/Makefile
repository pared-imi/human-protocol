clean-package:
	rm -rf build dist *.egg-info

format:
	pipenv run black .

run-test:
	pipenv run pytest

generate-json:
	./scripts/export-json-schema.sh
