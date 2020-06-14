function createModsChart(canvasId, mods) {
    const canvas = document.getElementById(canvasId).getContext("2d");
    const N = mods.length;
    let r = 1;
    let colors, n;
    while (!colors){
        n = N / r++ | 0 // fancy bitwise or 0 operator to force js to use int
        let _colors = palette( "mpn65", n );
        if (_colors) colors = _colors.map( c => `#${c}`);
    }
    console.log( {colors, N, r, n } );
    const chart = new Chart(canvas, {
        data: {
            datasets: mods.map(( mod, i ) => {

                let label = mod._id
                let data = mod.data
                    .map( datum => { return { t: datum.date, y: datum.count } } )
                    .sort( (a,b) => a.t - b.t )

                return {
                    label,
                    data,
                    type: "line",
                    fill: false,
                    borderColor: colors[i % n]
                }
            }),
        },
        options: {
            animation: {
                duration: 100
            },
            scales: {
                xAxes: [{
                    type: "time",
                    source: "data"
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,                  
                        labelString: "# of logs"
                    }
                }]
            }
        }
    })
}
