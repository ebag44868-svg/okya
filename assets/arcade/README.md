# 아케이드 에셋 (교체 가이드)

게임 그래픽을 여기에 넣고, `js/arcade/core.js`의 `ARCADE_ASSETS`에 경로만 채우면
코드 수정 없이 이미지가 적용된다. 비워두면 CSS/이모지 placeholder가 쓰인다.

```
assets/arcade/
  lottery/   (icon, thumbnail, hero, background, decorative)
  quiz/      (icon, thumbnail, hero, background, decorative)
  dash/      (icon, thumbnail, hero, background, player, obstacle, ground)
  math/      (icon, thumbnail, hero, background, decorative)
```

예) DASH 캐릭터를 학교 고양이 이미지로 교체:

```js
// js/arcade/core.js
const ARCADE_ASSETS={
  ...
  dash:{ ..., player:'assets/arcade/dash/player.png', ... },
}
```

슬롯 이름은 `js/arcade/core.js`의 `ARCADE_ASSETS` 키와 일치해야 하며,
`arcArt('dash','player')` 형태로 참조된다.
