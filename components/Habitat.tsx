// Layered paper-cut landscape. All coordinates are relative to the artboard.
const trees = [[2,58,.85],[9,66,.6],[16,58,1],[26,68,.68],[69,60,.87],[76,53,1.2],[86,61,.82],[95,51,1.35]];
export function Habitat(){
  return <div className="habitat" aria-hidden="true">
    <div className="artSun"/><div className="cloud cloudA"/><div className="cloud cloudB"/>
    <div className="ridge far"/><div className="ridge mid"/><div className="ridge front"/>
    {trees.map(([left,top,scale],i)=><i className="pine" key={i} style={{left:left+'%',top:top+'%',transform:'scale('+scale+')'}}/>)}
    <div className="earth"/><div className="fox">
      {['tail','tip','backleg','body','chest','leg','head','ear','cheek','muzzle','nose','eye'].map(c=><i key={c} className={c}/>)}
    </div>
    <div className="grass g1"/><div className="grass g2"/><div className="grass g3"/>
  </div>
}
