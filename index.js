/*
Written by Akshit
Not Optimized for performance
*/

const errorOk = 0.1;

/*
function EmiData(month, outLoan, emi, interest, tax, saving, pFee) {
	this.month = month;
	this.outLoan = outLoan;
	this.emi = emi;
	this.interest = interest;
	this.loanPaid = emi - interest;
	this.outP = outLoan - this.loanPaid;
	this.tax = tax;
	this.emi_tax = emi + tax;
	this.saving = saving;
	this.pFee = pFee;
}
*/

window.onload = function() {

	// one
	const savingCheck = document.getElementById('isSaving');

	savingCheck.addEventListener('change', (event) => {
		if (event.target.checked) {
			document.getElementById("savingsBox").style.display = "block";
		} else {
			document.getElementById("savingsBox").style.display = "none";
		}
	});

	// two
	const isOneTimeProcessingCheck = document.getElementById('isOneTimeProcessing');

	isOneTimeProcessingCheck.addEventListener('change', (event) => {
		if (event.target.checked) {
			document.getElementById("pFeeOneBox").style.display = "block";
			document.getElementById("pFeeAllBox").style.display = "none";
		} else {
			document.getElementById("pFeeOneBox").style.display = "none";
			document.getElementById("pFeeAllBox").style.display = "block";
		}
	});

	// three
	document.getElementById('startDate').value = new Date().toISOString().substring(0, 10);
	document.getElementById('emiDate').value = new Date().toISOString().substring(0, 10);

	// four
	const purDate = document.getElementById('startDate');
	const emiDate = document.getElementById('emiDate');

	purDate.addEventListener('change', (event) => {
		emiDate.min = event.target.value;
	});

	// five
	// Highcharts.setOptions(Highcharts.theme);
}

function onEMISubmit() {
	let amount = parseFloat(document.getElementById('amount').value);
	let duration = parseInt(document.getElementById('duration').value);
	let discount = parseFloat(document.getElementById('discount').value);
	let purDate = new Date(document.getElementById('startDate').value);
	let emiDate = new Date(document.getElementById('emiDate').value);
	let taxOnInterest = parseFloat(document.getElementById('gst').value);
	let isSaving = document.getElementById('isSaving').checked;
	let savingInterest = parseFloat(document.getElementById('savePercent').value);
	let isOneTimeProcessing = document.getElementById('isOneTimeProcessing').checked;
	let pFeeOne = parseFloat(document.getElementById('pFeeOne').value);
	let pFeeAll = parseFloat(document.getElementById('pFeeAll').value);
	let pFeeTax = parseFloat(document.getElementById('pFeeTax').value);

	let principal = amount - discount;
	let emi = Math.round(amount/duration);
	let tax = discount*taxOnInterest/100;
	let roipm = calRate(principal, emi, duration, 10, 30, 25);
	let roi = roipm*12*100;

	let pFeeOneTotal = (principal*pFeeOne)*(1+pFeeTax/100)/100;
	// Math.round((principal*pFeeOne/100)*(1+pFeeTax/100)*100)/100
	let pFeeAllOne = isOneTimeProcessing ? 0 : (pFeeAll)*(1+pFeeTax/100);
	// Math.round((pFeeAll)*(1+pFeeTax/100)*100)/100
	let pFeeAllTotal = duration * pFeeAllOne;

	let totalProcessingFee = isOneTimeProcessing?(pFeeOneTotal):(pFeeAllTotal);
	let savePercent = isSaving?(savingInterest/12):0;
	// not doing /100 as it is later repeat for rounding in getTableData fn

	let daysExtra = (Math.round(emiDate-purDate)/(1000*60*60*24));
	let savingsExtra = principal*savingInterest*daysExtra/365/100;

	let data = genTableData(principal, emi, duration, roipm, taxOnInterest/100, savePercent/100, pFeeAllOne);
	// let tableData = ans[0];

	drawTable(data);

	let saved = savingsExtra + parseFloat(data[data.length - 1][8]);
	let extra = tax + totalProcessingFee - saved;

	document.getElementById("loan").value = principal;
	document.getElementById("roi").value = roi.toFixed(2);
	document.getElementById("taxAmt").value = tax.toFixed(2);
	document.getElementById("feeAmt").value = totalProcessingFee.toFixed(2);
	document.getElementById("saved").value = saved.toFixed(2);
	document.getElementById("total").value = extra.toFixed(2);

	if (extra < 0) {
		extra = 0;
	}

	let chartData = [
		["Principal", principal, false],
		["Interest", discount, true],
		["Extra Added", extra, false],
	];

	let months = [];
	for (let i = 1; i <= duration; i++) {
		months.push(i);
	}

	let barChartData = [
		{
			name: "Tax Paid",
			data: data.map(x => parseFloat(x[6])).slice(0, length-1)
		},
		{
			name: "Interest Paid",
			visible: false,
			data: data.map(x => parseFloat(x[3])).slice(0, length-1)
		},
		{
			name: "Principal Paid",
			visible: false,
			data: data.map(x => parseFloat(x[4])).slice(0, length-1)
		},
	];

	genChart(chartData);
	genBarChart(months, barChartData);
	document.getElementById("results").style.display = "block";
	return false;
}

function calRate(p, e, n, lo, up, tries) {
	lo = lo/12/100;
	up = up/12/100;
	while(tries > 0) {
		mid = (lo+up)/2;
		// console.log("lo: " + lo + ",up:" + up + ",mid: " + mid);
		let midEmi = getE(p, mid, n);
		if (errorFixed(midEmi, e)) {
			return mid;
		} else if (midEmi > e) {
			up = mid;
		} else {
			lo = mid;
		}
		tries--;
	}
	return mid;
}

function getE(p, r, n) {
	let t = Math.pow((1 + r), n);
	return p*r*t/(t-1);
}

function errorFixed(a, b) {
	// console.log("Cal: " + a + ", e: " + b);
	if ((a-b>=0 && a-b<=errorOk) || (a-b<0 && b-a <= errorOk)) {
		return true;
	}
	return false;
}

function genTableData(p, e, n, r, tax, saveP, fee) {
	let data = [];
	// let totalSave = 0;
	let dataTotal = ["Total",0,0,0,0,0,0,0,0,0]
	for(let i=0;i<n;i++) {
		let interest = p*r;
		let taxAmt = interest * tax;
		let outP = Math.round(p - e + interest);
		let saving = outP*saveP;
		// totalSave += saving;
		// totalSave = Math.round(totalSave);
		dataTotal[3] += interest;
		dataTotal[4] += (e-interest);
		dataTotal[6] += taxAmt;
		// dataTotal[7] += e + taxAmt;
		dataTotal[8] += saving;
		let item = [i+1, p.toFixed(2), e, interest.toFixed(2), (e-interest).toFixed(2), (p-e+interest).toFixed(2), taxAmt.toFixed(2), (e+taxAmt).toFixed(2), saving.toFixed(2), fee.toFixed(2)];
		// let item = new EmiData(i+1, p, e, interest, taxAmt, saving, fee);
		data.push(item);
		p=outP;
	}
	dataTotal[7] = dataTotal[3] + dataTotal[4] + dataTotal[6];
	dataTotal[9] = fee * n;
	for (let i = 1; i < dataTotal.length; i++) {
		dataTotal[i] = dataTotal[i]==0 ? '-' : dataTotal[i].toFixed(2);
	}
	data.push(dataTotal);
	return data;
}

function genChart(dat) {
	Highcharts.chart("t_chart", {
		title: {
			text: "Total Amount"
		},
		series: [{
			type: 'pie',
			allowPointSelect: true,
			keys: ['name', 'y', 'selected', 'sliced'],
			data: dat,
			showInLegend: true
		}]
	});
}

function genBarChart(months, data) {
	Highcharts.chart("b_chart", {
		chart: {
			type: "column"
		},
		title: {
			text: "Per month Stacks"
		},
		xAxis: {
			categories: months
		},
		yAxis: {
			min: 0,
			title: {
				text: 'Total Paid'
			},
			stackLabels: {
				enabled: true,
				style: {
					fontWeight: 'bold',
					color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
				}
			}
		},
		tooltip: {
			headerFormat: '<b>Month: {point.x}</b><br/>',
			pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
		},
		plotOptions: {
			column: {
				stacking: 'normal',
				dataLabels: {
					enabled: true,
					color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
				}
			}
		},
		series: data
	});
}

function drawTable(data) {
	let tab = "";
	data.forEach(item => {
		tab += "<tr>"
		tab += "<th scope='row'>" + item[0] + "</th>"
		for (let i=1;i<item.length;i++) {
			tab += "<td>" + item[i] + "</td>";
		}
		tab += "</tr>"
	});
	document.getElementById("dataTableBody").innerHTML = tab;
}