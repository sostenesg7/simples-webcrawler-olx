'use strict'
const cheerio = require('cheerio')
const request = require('request')
const fs = require('fs')
const Iconv = require('iconv').Iconv
const entities = require('entities')
const https = require('https')
const Buffer = require('buffer').Buffer
//Converter para utf8
const iconv = new Iconv('latin1', 'utf-8')//'ISO-8859-1'
const encoding = require('encoding')
const MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true } , (err, client)=>{
    if(err) {
        console.log(err)
        return
    }

    console.log('conectado ao db')
    const db = client.db('crawler')
    let produtosCollection = db.collection('anuncios')

    for(let i = 1; i<100; i++){
        capturarAnuncios(`https://pe.olx.com.br/?o=${i}`).then(arrAnuncios=>{
            //console.log(arrAnuncios)
            produtosCollection.insertMany(arrAnuncios)
            //console.log(arrAnuncios.length + ' anuncios salvos')
        }).catch(err=>{
            console.log(err)
        })
    }
})

/*Trata o valor dos elementos*/
function tratarValElem(val) {
    return val.trim().replace(/[\n\t]/g, '')
}

function capturarAnuncios(rota) {

    return new Promise((resolve, reject) => {
        request(rota, {encoding: 'latin1'}, (err, res, html) => {
            if(err || res.statusCode !== 200) {
                reject(err)
                return
            }

            const $ = cheerio.load(html, {decodeEntities: false, xmlMode: true})
            let anunciosDOM = $('.section_OLXad-list .list .item .OLXad-list-link')
            let anuncios = []

            anunciosDOM.each((i, el)=>{
                
                let elem = $(el)
                
                let foto = elem.find('.image').attr('src')
                let precoAntigo = elem.find('.OLXad-list-old-price').text()
                let data = elem.find('.col-4 .text')
                
                anuncios.push({
                    id:             tratarValElem(elem.attr('id')),
                    titulo:         tratarValElem(elem.find('.OLXad-list-title').text()),
                    preco:          tratarValElem(elem.find('.OLXad-list-price').text()),
                    precoAntigo:    precoAntigo === undefined? '' : tratarValElem(precoAntigo),
                    categoria:      tratarValElem(elem.find('.detail-category').text()),
                    regiao:         tratarValElem(elem.find('.detail-region').text()),
                    url:            tratarValElem(elem.attr('href')),
                    foto:           foto === undefined? '': tratarValElem(foto),
                    data:           tratarValElem($(data[0]).text()),
                    hora:           tratarValElem($(data[1]).text())
                })

            })

            console.log(anuncios.length + ' anuncios capturados')
            resolve(anuncios)

        })
    })
}



//let utfTittle = iconv.convert(Buffer.from($(title).html()));
//console.log(utfTittle.toString().trim())
//Decodificar caracteres
//let utf8Title = encoding.convert($(title).html().trim(), 'UTF-8', 'Latin_1')
//console.log(JSON.stringify(titleArray))
