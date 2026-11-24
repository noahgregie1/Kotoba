import { normalize, undecided, type Judgment } from './game.ts';

// canonical spelling | reading | translation | additional aliases
const entries = `犬|いぬ|dog
柴犬|しばいぬ|Shiba Inu|しばけん
秋田犬|あきたいぬ|Akita dog|あきたけん
ハシビロコウ|はしびろこう|shoebill
猫|ねこ|cat
狐|きつね|fox
狸|たぬき|raccoon dog
狼|おおかみ|wolf
兎|うさぎ|rabbit
鹿|しか|deer
熊|くま|bear
馬|うま|horse
牛|うし|cow
羊|ひつじ|sheep
山羊|やぎ|goat
豚|ぶた|pig
猿|さる|monkey
象|ぞう|elephant
麒麟|きりん|giraffe
犀|さい|rhinoceros
河馬|かば|hippopotamus
虎|とら|tiger
ライオン|らいおん|lion|獅子|しし
豹|ひょう|leopard
パンダ|ぱんだ|panda
鼠|ねずみ|mouse
栗鼠|りす|squirrel
蝙蝠|こうもり|bat
鯨|くじら|whale
海豚|いるか|dolphin
鮫|さめ|shark
蛸|たこ|octopus
烏賊|いか|squid
魚|さかな|fish|うお
鳥|とり|bird
雀|すずめ|sparrow
鴉|からす|crow|烏
鶴|つる|crane
梟|ふくろう|owl
鶏|にわとり|chicken
ペンギン|ぺんぎん|penguin
蛇|へび|snake
亀|かめ|turtle
蛙|かえる|frog
鰐|わに|crocodilian
蝶|ちょう|butterfly|ちょうちょ
蜂|はち|bee or wasp
蟻|あり|ant
蟹|かに|crab
海老|えび|shrimp|蝦
ハムスター|はむすたー|hamster
コアラ|こあら|koala
カンガルー|かんがるー|kangaroo
ゴリラ|ごりら|gorilla
縞馬|しまうま|zebra
猪|いのしし|wild boar
ラッコ|らっこ|sea otter
チワワ|ちわわ|Chihuahua
三毛猫|みけねこ|calico cat`;
const lookup = new Map<string, Judgment>();
for (const line of entries.split('\n')) {
  const [canonical, reading, translation, ...aliases] = line.split('|');
  const result = { valid: true, canonical, reading, translation, conceptId: 'animal/' + canonical,
    reason: 'Established Japanese animal name.', confidence: 1 };
  for (const spelling of [canonical, reading, ...aliases]) lookup.set(normalize(spelling), result);
}
export function localJudge(word: string): Judgment {
  const hit = lookup.get(normalize(word));
  if (hit) return hit;
  if (/^(大きい犬|おおきいいぬ|小さい猫|ちいさいねこ|車|くるま|学校|がっこう|りんご|林檎|机|つくえ|木|き)$/.test(normalize(word))) {
    return { ...undecided('Use an established animal name. Descriptions and unrelated words do not count.'), valid: false, confidence: 1 };
  }
  return undecided('This word is outside the demo dictionary.');
}
