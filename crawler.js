'use-strict'

const cheerio = require('cheerio')
const request = require('request')
const fs = require('fs')
const Iconv = require('iconv').Iconv
var entities = require('entities')
var https = require('https')

var Buffer = require('buffer').Buffer

//Converter para utf8
var iconv = new Iconv('latin1', 'utf-8')//'ISO-8859-1'

var encoding = require('encoding')

var MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true } , (err, client)=>{
    if(err) {
        console.log(err)
        return
    }

    console.log('conectado ao db')
    const db = client.db('crawler')

    var produtosCollection = db.collection('anuncios')

    var i = 1

    for(i;i<100;i++){
        capturarAnuncios(`https://pe.olx.com.br/?o=${i}`).then(arrAnuncios=>{
            produtosCollection.insertMany(arrAnuncios)
            console.log(arrAnuncios.length + ' anuncios salvos')
        }).catch(err=>{
            console.log(err)
        })
    }


})

//Com HTTPS
/*require('https').get('https://pe.olx.com.br/', (res) => {
    res.setEncoding('latin1');
    res.on('data', function (body) {
        const $ = cheerio.load(body, {decodeEntities: false, xmlMode: true})
        var titles = $('.OLXad-list-title')

        titles.each((i,title)=>{
            console.log($(title).html().trim())
        })
    });
});*/

//Com request

function capturarAnuncios(rota) {

    return new Promise((resolve, reject) => {
        request(rota, {encoding: 'latin1'}, (err, res, html) => {
            var titleArray = []

            if(err || res.statusCode !== 200) {
                reject(err)
                return
            }

            const $ = cheerio.load(html, {decodeEntities: false, xmlMode: true})
            var titles = $('.OLXad-list-title')

            titles.each((i, title) => {
                titleArray.push({title: $(title).html().trim()})
            })

            console.log(titles.length + ' anuncios capturados')

            resolve(titleArray)

        })
    })
}



//var utfTittle = iconv.convert(Buffer.from($(title).html()));
//console.log(utfTittle.toString().trim())
//Decodificar caracteres
//var utf8Title = encoding.convert($(title).html().trim(), 'UTF-8', 'Latin_1')
//console.log(JSON.stringify(titleArray))
