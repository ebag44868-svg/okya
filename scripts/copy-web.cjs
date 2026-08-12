/* 루트의 웹 소스(index.html + css/ + js/ + assets/)를 Capacitor webDir인 www/ 로 복사.
 * 루트는 GitHub Pages 배포 + `npm run dev`의 소스(단일 진실). www/는 생성물(gitignore).
 * 사용: npm run copy  또는  npm run sync (copy + cap sync)
 */
const fs = require('fs'), path = require('path')
const root = path.join(__dirname, '..')
const www = path.join(root, 'www')

fs.rmSync(www, { recursive: true, force: true })
fs.mkdirSync(www, { recursive: true })

fs.copyFileSync(path.join(root, 'index.html'), path.join(www, 'index.html'))
for (const d of ['css', 'js', 'assets']) {
  fs.cpSync(path.join(root, d), path.join(www, d), { recursive: true })
}
console.log('web → www 복사 완료 (index.html + css/ + js/ + assets/)')
