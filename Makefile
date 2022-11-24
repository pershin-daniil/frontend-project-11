lint:
	npx eslint . --fix
install:
	npm ci
build:
	rm -rf dist
	npx webpack
start:
	npx webpack serve --mode development
test:
	npx playwright test
