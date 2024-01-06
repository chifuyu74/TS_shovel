const { devDependencies, dependencies } = require("./package.json");
const { exec } = require("child_process");

let devDeps = [];
if (devDependencies) {
  devDeps = Object.keys(devDependencies);
}

let deps = [];

if (dependencies) {
  deps = Object.keys(dependencies);
}

const dep = [...deps, ...devDeps];

console.log(dep);

const removeConsole = `yarn remove ${dep.join(" ")}`;
exec(removeConsole, (err, stdout, stderr) => {
  if (err) return;

  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});