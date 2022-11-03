lint:
	npx eslint . --fix
install:
	npm ci
build:
	rm -rf dist
	NODE_ENV=production npx webpack
start:
	npx webpack serve --mode development
