import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHeaders = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

// ── HSN/SAC data from master file (821 HSN + 28 SAC codes) ──
const HSN_MASTER = [{"code": "1010000", "description": "Exempted", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "703", "description": "Lemon", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "9023020", "description": "Tea", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "12110000", "description": "sed primarily in perfumery, in pharmacy or for insecticidal, fungicidal or similar purpose.", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "13122", "description": "", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "15180040", "description": "Oil", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "17011490", "description": "Sugar", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "17029000", "description": "other sugars, including chemically pure lactose, maltose, glucose and fructose, in solid form; sugar syrups not containing added flavoring or coloring matter; artificial honey, whether or not mixed with natural honey; caramel - other fructose and fru", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "17029090", "description": "Other sugars, including chemically pure lactose, maltose, glucose and fructose, in solid form; sugar syrups not containing added flavouring or colouring matter; artificial honey, whether or not mixed with natural honey; caramel - other fructose and f", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "19042000", "description": "Prepared Foods Obtained By The Swelling", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "1905000", "description": "Cake", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "19051000", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "19053100", "description": "Bread, Pastry, Cakes, Biscuits And Other Bakerr Wares", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "21061000", "description": "Food Preparations Not Elsewhere Specified", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "21069099", "description": "Food Preparations Not Elsewhere Specified", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "22011010", "description": "Waters, Including Natural Or Artificialmineral Waters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "22020000", "description": "Waters, Including Mineral Waters And Aerated Waters", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "25010000", "description": "Salt (Including Table Salt And Denatured Salt) And Pure Sodium Chloride", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "25132000", "description": "Emery, Natural Corundum, Natural Garnet And Other Natural Abrasives", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "25220000", "description": "Chemical", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "25232930", "description": "Portland Cement, Aluminous Cement, Slag Cement", "igst": 28.0, "cgst": 14.0, "sgst": 14.0}, {"code": "25232940", "description": "Portland Cement, Aluminous Cement, Slag Cement", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "27011980", "description": "Other Coal", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "27073000", "description": "Oils And Other Products Of The Distillation Of High Temperature Coal Tar", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "27075000", "description": "Oils And Other Products Of The Distillation Of High Temperature Coal Tar", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "27100000", "description": "Petroleum Oils And Oils Obtained From Bituminous Minerals", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "27101972", "description": "Oil", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "27101980", "description": "Petroleum Oils And Oils Obtained From Bituminous Minerals", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "27101989", "description": "Other Cutting Oil, Hydraulic Oil", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "27101990", "description": "Petroleum Oils And Oils Obtained From Bituminous Minerals", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "27109900", "description": "Petroleum Oils And Oils Obtained From Bituminous Minerals", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "27111900", "description": "Petroleum Gases And Other Gaseous Hydrocarbons - Liquified: Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "27160000", "description": "Electrical Energy", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "28043000", "description": "Hydrogen, Rare Gases And Other Non-Metals - Nitrogen", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28061000", "description": "Hydrogen Chloride (Hydrochloric Acid); Chlorosulphuric Acid", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28070010", "description": "Sulphuric Acid; Oleum Sulphuric Acid; Oleum : Sulphuric Acid", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28080010", "description": "Nitric Acid; Sulphonitric Acids - Nitric Acid; Sulphonitric Acids : Nitric Acid", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28092010", "description": "Diphosphorus Pentoxide; Phosphoric Acid", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28092020", "description": "Polyphosphoric Acids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28110000", "description": "Other Inorganic Acids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28111990", "description": "Other Inorganic Acids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28151110", "description": "Sodium Hydroxide (Caustic Soda)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28151200", "description": "Sodium Hydroxide (Caustic Soda)", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "28191000", "description": "Chromium Oxides And Hydroxides", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28261990", "description": "Fluorides; Fluorosilicates", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28271000", "description": "HS Codes Classification of Ammonium chloride", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28272000", "description": "Chlorides, Chloride Oxides And Chloride Hydroxides", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28334000", "description": "Ammonium Persulphate", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28341090", "description": "Nitrites", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28342990", "description": "Nitrites", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28479950", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "28530010", "description": "Other Inorganic Compounds (Including Distilled Or Conductivity Water)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "29023000", "description": "Cyclic Hydrocarbons -Toluene", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "29024400", "description": "Cyclic Hydrocarbons - Xylenes : Mixed Xylene Isomers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "29031400", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "29037100", "description": "Halogenated Derviatives Of Hydrocarbons", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "29051210", "description": "Propyl Alcohol", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "29051220", "description": "Acyclic Alcohols And Their Halogenated, Sulphonated, Nitrated", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "29094300", "description": "Ethers, Ether-Alcohols, Ether-Phenols, Etheralcohol", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "29141200", "description": "Ketones And Quinones", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "29152990", "description": "Saturated Acyclic Monocarboxylic Acids And Their Anhydrides", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "29181500", "description": "Salts And Esters Of Citric Acid", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "29214533", "description": "Amine- Function Compounds - Acyclic Monoamines and Their Derivatives", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "29214590", "description": "Amine- Function Compounds - Aromatic Monoamines And Their Derivatives", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "29291090", "description": "Compounds With Other Nitrogen Function", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "30040000", "description": "Medicaments Consisting of Mixed or Unmixed Products", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "30050000", "description": "Wadding, Gauze, Bandages And Similar Articles", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "32060000", "description": "Other Colouring Matter; Preparations As Specified In Note 3 To This Chapter", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32064990", "description": "Other Colouring Matter; Preparations As Specified In Note 3 To This Chapter", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32080000", "description": "Paints And Varnishes (Including Enamels And Lacquers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32080090", "description": "Paints And Varnishes", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "32081010", "description": "Paints And Varnishes (Including Enamels And Lacquers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32081090", "description": "Paint", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32082010", "description": "Paints And Varnishes (Including Enamels And Lacquers) Based On Synthetic Polymers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32082090", "description": "Paints And Varnishes (Including Enamels And Lacquers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32089000", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32089011", "description": "Paints And Varnishes (Including Enamels And Lacquers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32089019", "description": "Paints And Varnishes (Including Enamels And Lacquers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32089021", "description": "Paints And Varnishes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32089022", "description": "Paints And Varnishes (Including Enamels And Lacquers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32089029", "description": "Paints And Varnishes (Including Enamels And Lacquers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32089049", "description": "Paints And Varnishes (Including Enamels And Lacquers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32089090", "description": "Paints And Varnishes (Including Enamels And Lacquers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32090000", "description": "Paints And Varnishes (Including Enamels And Lacquers)", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "32091000", "description": "Based On Acrylic Or Vinyl Polymers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32091010", "description": "Paints And Varnishes (Including Enamels And Lacquers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32091090", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32099090", "description": "Paints And Varnishes (Including Enamels And Lacquers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32140000", "description": "Glaziers Putty, Grafting Putty, Resin Cements", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32141000", "description": "Glaziers Putty, Grafting Putty, Resin Cements", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32149010", "description": "Glaziers Putty, Grafting Putty, Resin Cements, Caulking", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32149090", "description": "Glaziers Putty, Grafting Putty, Resin Cements", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32150000", "description": "Printing Ink, Writing Or Drawing Ink And Other Inks, Whether", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "32190000", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "33051090", "description": "Preparations For Use On The Hair Shampoos: Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "33061020", "description": "Preparations For Oral Or Dental Hygiene,", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "33074100", "description": "Pre-Shave, Shaving or After - Shave Preparations", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "34020000", "description": "Organic Surface-Active Agents (Other Than Soap)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "34021110", "description": "Organic Surface-Active Agents (Other Than Soap)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "34022090", "description": "Organic Surface-Active Agents (Other Than Soap)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "34029019", "description": "Organic Surface-Active Agents (Other Than Soap),", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "34029042", "description": "Organic Surface-Active Agents (Other Than Soap)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "34029090", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "34029099", "description": "Organic Surface-Active Agents (Other Than Soap)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "34030000", "description": "Lubricating Preparations (Including Cuttingoil Preparations", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "34031900", "description": "Lubricating Preparations (Including Cuttingoil Preparations", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "34039900", "description": "Lubricating Preparations (Including Cuttingoil Preparations", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "34054000", "description": "Polishes and creams, for footwear, furniture,floors, coachwork, glass", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "34059010", "description": "Polishes And Creams, For Footwear, Furniture, Floors,", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "35060000", "description": "Prepared Glues And Other Prepared Adhesives", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "35061000", "description": "Prepared Glues And Other Prepared Adhesives", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "35069190", "description": "Prepared Glues And Other Prepared Adhesives", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "35069999", "description": "Prepared Glues And Other Prepared Adhesives", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38080000", "description": "Insecticides, Rodenticides, Fungicides", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38089900", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38101090", "description": "Pickling Preparations For Metal Surfaces", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38119000", "description": "Anti-Knock Preparations, Oxidation Inhibitors,", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38140000", "description": "Organic Composite Solvents And Thinners", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38140010", "description": "Organic Composite Solvents And Thinners", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38200000", "description": "Anti-Freezing Preparations And Prepared De-Icing Fluids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38220000", "description": "Diagnostic Or Laboratory Reagents On A Backing", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38220011", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38220090", "description": "Diagnostic Or Laboratory Reagents On A Backing", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "38229090", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38244010", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38249022", "description": "Prepared Binders For Foundry Moulds Or Cores", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38249090", "description": "Prepared Binders For Foundry Moulds Or Cores", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38249900", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38249950", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "38254900", "description": "", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "39010000", "description": "Polymers Of Ethylene, In Primary Forms", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39070000", "description": "Polyacetals, Other Polyethers And Epoxide Resins", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39071000", "description": "Polyacetals, Other Polyethers And Epoxide Resins", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39073010", "description": "Polyacetals, Other Polyethers And Epoxide Resins", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39073090", "description": "Polyacetals, Other Polyethers And Epoxide Resins", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39079090", "description": "Polymers Of Ethylene, In Primary Forms - Other: Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39079120", "description": "Polyacetals, Other Polyethers And Epoxide Resins", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39079990", "description": "Polyacetals, Other Polyethers And Epoxide Resins", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39093990", "description": "Amino-resins, phenolic resins and polyurethanes", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "39100000", "description": "silicones in primary forms", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "39150000", "description": "Waste, Parings And Scrap, Of Plastics", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39151000", "description": "Waste, Parings And Scrap, Of Plastics", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39159010", "description": "Waste, Parings And Scrap, Of Plastics", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39159090", "description": "Waste, Parings And Scrap, Of Plastics", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39160000", "description": "Monofilament Of Which Any Cross-Sectional Dimension Exceeds 1 Mm", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39162019", "description": "Monofilament Of Which Any Cross - Sectional Dimension Exceeds", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39170000", "description": "Tubes, Pipes And Hoses, And Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39171010", "description": "Tubes, Pipes And Hoses, And Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39171020", "description": "Tubes, Pipes And Hoses, And Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39172100", "description": "Of Polymers Of Ethylene", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39172110", "description": "Tubes, Pipes And Hoses, And Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39172190", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39172300", "description": "Of Polymers Of Vinyl Chloride", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39172310", "description": "Tubes, Pipes And Hoses, And Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39172390", "description": "Tubes, Pipes And Hoses, And Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39172990", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39173010", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39173100", "description": "Tubes, Pipes And Hoses, And Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39173290", "description": "Tubes, Pipes And Hoses, And Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39173990", "description": "Tubes, Pipes And Hoses, And Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39174000", "description": "Tubes, Pipes And Hoses, And Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39190000", "description": "Self-Adhesive Plates, Sheets, Film, Foil, Tape", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39191000", "description": "Self - Adhesive Plates, Sheets, Film, Foil, Tape", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39199090", "description": "Self-Adhesive Plates, Sheets, Film, Foil, Tape", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39200000", "description": "Other Plates, Sheets, Film, Foil And Strip", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39201000", "description": "Of Polymers Of Ehtylene", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39201012", "description": "Other Plates, Sheets, Film, Foil And Strip", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39201019", "description": "Other Plates, Sheets, Film, Foil And Strip", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39204300", "description": "Other Plates, Sheets, Film, Foil And Strip, Of Plastics", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39209941", "description": "Taflon material", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "39209949", "description": "Other Plates, Sheets, Film, Foil And Strip, Of Plastics", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39211100", "description": "Other Plates, Sheets, Film, Foil And Strip", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39211900", "description": "Plates, sheets, film, foil, and strip of plastics.", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "39229000", "description": "Baths, Shower - Baths, Sinks, Wash - Basins, Bidets, Lavatory Pans", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39230000", "description": "Articles For The Conveyance Or Packing Of Goods", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39231090", "description": "Articles For The Conveyance Or Packing Of Goods", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39235010", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39239000", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39239090", "description": "Articles For The Conveyance Or Packing Of Goods, Of Plastics;", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39241010", "description": "tableware and kitchenware", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39241090", "description": "Plastic materials", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "39249000", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39249010", "description": "Tableware, Kitchenware, Other Household Articles And Hygienic", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39249090", "description": "Tableware, Kitchenware, Other Household Articles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39250000", "description": "Builders Ware Of Plastics", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39252000", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39260000", "description": "Other Articles Of Plastics And Articles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39261000", "description": "Office Or School Supplies", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39261099", "description": "Office Or School Supplies: Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39262029", "description": "Other Articles Of Plastics And Articles Of Other Materials Of Headings 3901 To 3914", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "39264000", "description": "Cable ties", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "39269080", "description": "Other Articles Of Plastics And Articles Of Other Materials", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "39269099", "description": "Other Articles Of Plastics And Articles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40021100", "description": "Synthetic Rubber And Factice Derived From Oils,", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "40024900", "description": "Synthetic Rubber And Factice Derived From Oils,", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40061000", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40080000", "description": "Plates, Sheets, Strip, Rods And Profile Shapes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40081190", "description": "Plates, Sheets, Strip, Rods And Profile Shapes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40082190", "description": "Plates, Sheets, Strip, Rods And Profile Shapes", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "40082930", "description": "Plates, Sheets, Strip, Rods And Profile Shapes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40090000", "description": "Tubes, Pipes And Hoses, Of Vulcanised Rubber", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40091100", "description": "Tubes, Pipes And Hoses, Of Vulcanised Rubber", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40094200", "description": "Tubes, Pipes And Hoses, Of Vulcanised Rubber", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "40100000", "description": "Conveyor Or Transmission Belts", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40103390", "description": "Conveyor Or Transmission Belts", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40110000", "description": "New Pneumatic Tyres, Of Rubber", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "40117000", "description": "Of A Kind Used On Agricultural", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40151100", "description": "Articles Of Apparel And Clothing Accessories", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "40151900", "description": "Articles Of Apparel And Clothing Accessories", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "40159030", "description": "Glouse", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40160000", "description": "Other Articles Of Vulcanised Rubber", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "4016390", "description": "Gaskets, Washers And Other Seals : Other", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "40169030", "description": "Articles Of Vulcanised Rubber Other Than Hard Rubber - Other : Gaskets, Washers And Other Seals", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "40169320", "description": "Other Articles Of Vulcanised Rubber", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40169330", "description": "Other Articles Of Vulcanised Rubber Other Than Hard Rubber", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40169340", "description": "Other Articles Of Vulcanised Rubber", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40169390", "description": "Other Articles Of Vulcanised Rubber", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "40169990", "description": "Other Articles Of Vulcanised Rubber", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "40180000", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "42020000", "description": "Trunks, Suit-Cases, Vanity-Cases, Executivecases , Brief - Cases", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "44120000", "description": "Plywood, Veneered Panels And Similar Laminated Wood", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "441480", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "44149000", "description": "Wood and articles of wood", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "44150000", "description": "Packing Cases, Boxes, Crates, Drums", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "44151000", "description": "Packing Cases, Boxes, Crates, Drums And Similar Packings, Of Wood", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "44219090", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "47079000", "description": "Recovered(Waste and Scrap) paper or Paperboard", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "48010000", "description": "Newsprint, In Rolls Or Sheets", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "48020000", "description": "Uncoated Paper And Paperboard", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "48025790", "description": "Paper", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "48110000", "description": "Paper, Paperboard, Cellulose Wadding And Webs Of Cellulose Fibres", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "48114100", "description": "Paper, Paperboard, Cellulose Wadding And Webs Of Cellulose Fibres", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "48161000", "description": "Carbon-Paper, Self-Copy Paper And Other Copying", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "48172000", "description": "Envelopes, Letter Cards, Plain Postcards", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "48192010", "description": "Cartons, Boxes, Cases, Bags And Other Packing Containers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "48192020", "description": "Cartons, boxes, cases, bags and other packing containers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "48200000", "description": "Registers, Account Books, Note Books, Order Books", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "48201000", "description": "Registers, Account Books, Note Books, Order Book", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "48201010", "description": "Registers, Account Books, Note Books, Order Books", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "48201090", "description": "Registers, Account Books, Note Books, Order Books", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "48202000", "description": "Registers, Account Books, Note Books, Order Books", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "48211010", "description": "Paper Or Paperboard Labels Of All Kinds", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "48211020", "description": "Paper Or Paperboard Labels Of All Kinds", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "49010000", "description": "Printed Books, Brochures", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "49011010", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "49100010", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "49111010", "description": "Other Printed Matter, Including Printed Pictures And Photographs", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "52020000", "description": "Cotton Waste (Including Yarn Waste And Garnetted Stock)", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "52021000", "description": "Cotton Waste (Including Yarn Waste And Garnetted Stock) Yarn Waste (Including Thread Waste)", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "54070000", "description": "Woven Fabrics Of Synthetic Filament Yarn", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "54071015", "description": "Woven Fabrics Of Synthetic Filament Yarn", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "55081000", "description": "sewing thread of man-made staple fibres", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "56070000", "description": "Twine, Cordage, Ropes And Cables, Whether Or Not Plaited", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "56075040", "description": "Twine, Cordage, Ropes And Cables", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "56081900", "description": "Knotted Netting Of Twine, Cordage Or Rope", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "59119090", "description": "Textile Products And Articles, For Technical Uses", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "60033000", "description": "Cloth", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "60069000", "description": "Cotton Waste", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "61050000", "description": "Men'S Or Boys Shirts, Knitted Or Crocheted", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "61091000", "description": "T-Shirts, Singlets And Other Vests, Knitted Or Crocheted - Of Cotton", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "61169200", "description": "Gloves, Mittens And Mitts", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "62010000", "description": "", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "62030000", "description": "en'S Or Boys Suits, Ensembles", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "62050000", "description": "Men'S Or Boys Shirts", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "62103090", "description": "Garments, Made Up Of Fabrics Of Heading 5602", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "62160010", "description": "Gloves, Mittens and Mitts", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "63071010", "description": "Other Made Up Articles, Including Dress Patterns Floor-Cloths", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "63079090", "description": "Face Mask", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "64034000", "description": "", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "68040000", "description": "Millstones, Grindstones, Grinding Wheels And The Like,", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "68041000", "description": "Millstones, Grindstones", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "68042110", "description": "Tools", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "68042210", "description": "Millstones, Grindstones, Grinding Wheels And The Like, Without Frameworks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "68042290", "description": "Millstones, Grindstones, Grinding Wheels And The Like,", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "68050000", "description": "Natural Or Artificial Abrasive Powder Or Grain", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "68052040", "description": "Natural Or Artificial Abrasive Powder Or Grain", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "68052090", "description": "Natural Or Artificial Abrasive Powder Or Grain", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "68053000", "description": "Mens Or Boys Shirts - Of Man-Made Fibres", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "68060000", "description": "Slag Wool, Rock Wool And Similar Mineral Wools", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "68080000", "description": "Panels, Boards, Tiles, Blocks And Similar Articles Of Vegetable Fibre", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "68120000", "description": "Fabricated Asbestos Fibres", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "68129922", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "69010000", "description": "Bricks, Blocks, Tiles And Other Ceramic Goods Of Siliceous Fossil Meals", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "69050000", "description": "Roofing Tiles, Chimney-Pots, Cowls, Chimney Liners", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "69072110", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "69072200", "description": "Of A Water Absorption Coefficient By Weight Exceeding 0.5%", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "69072300", "description": "Of A Water Absorption Coefficient By Weight Exceeding 10%", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "69101000", "description": "Tank", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "70050000", "description": "Float Glass And Surface Ground Or Polished Glass, In Sheets,", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "70170000", "description": "Laboratory, Hygienic Or Pharmaceutical Glassware", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "70171000", "description": "Laboratory, Hygienic Or Pharmaceutical Glassware", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "70179010", "description": "Laboratory, Hygienic Or Pharmaceutical Glassware", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "70179090", "description": "Laboratory, Hygienic Or Pharmaceutical Glassware", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "70195900", "description": "Glass Fibres (Including Glass Wool) And Articles Thereof", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "70199000", "description": "Glass Fibres (Including Glass Wool) And Articles Thereof", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "70199090", "description": "Glass Fibres (Including Glass Wool) And Articles Thereof (For Example, Yarn, Woven Fabrics)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72031000", "description": "Ferrous Products Obtained by Direct Reduction Of Iron Ore", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72040000", "description": "Ferrous Waste And Scrap", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72041000", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72042110", "description": "Ferrous Waste And Scrap", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72043000", "description": "Waste And Scrap Of Tinned Iron or Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72044900", "description": "Ferrous Waste And Scrap", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "720711", "description": "Cross-Section, The Width Measuring Less Than Twice The Thickness", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "72071190", "description": "a diagnostic radiologic examination of the thoracic spine, consisting of two views", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "72082590", "description": "Flat-Rolled Products Of Iron Or Non-Alloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72091600", "description": "Of A Thickness Exceeding 1 Mm But Less Than 3 Mm", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72092820", "description": "Sheet Metal", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72100000", "description": "Flat-Rolled Products Of Iron Or Non-Alloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72104900", "description": "Flat Rolled Products Of Iron", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72107000", "description": "Flat-Rolled Products Of Iron Or Non-Alloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72111410", "description": "Flat-Rolled Products Of Iron Or Non-Alloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72120000", "description": "Flat-Rolled Products Of Iron Or Non-Alloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72140000", "description": "Other Bars And Rods Of Iron Or Non-Alloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72141090", "description": "Other Bars And Rods Of Iron Or Non-Alloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72142090", "description": "Other Bars And Rods Of Iron Or Non-Alloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72149190", "description": "Other Bars And Rods Of Iron Or Non-Alloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72149990", "description": "Other Bars And Rods Of Iron Or Non-Alloy Steel", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "72150000", "description": "Other Bars And Rods Of Iron Or Non-Alloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72155010", "description": "Other Bars And Rods Of Iron Or Non-Alloy Steel - Other", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "72160000", "description": "Angles, Shapes And Sections Of Iron Or Nonalloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72164000", "description": "Angles, Shapes And Sections Of Iron Or Nonalloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72170000", "description": "Wire Of Iron Or Non-Alloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72171000", "description": "Not Plated Or Coated, Whether Or Not Polished", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72172000", "description": "Iron and steel , plated Or Coated With Zinc", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72179000", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72179099", "description": "Wire Of Iron Or Non-Alloy Steel,Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72180000", "description": "Stainless Steel In Ingots Or Other Primary Forms", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72199013", "description": "Flat-Rolled Products Of Stainless Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72220000", "description": "Other Bars And Rods Of Stainless Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72224020", "description": "Other Bars And Rods Of Stainless Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "72286012", "description": "Other Bars And Rods Of Other Alloy Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73010000", "description": "Sheet Piling Of Iron Or Steel, Whether Or Not Drilled", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73011000", "description": "Sheet Piling Of Iron Or Steel, Whether Or Not Drilled", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73012090", "description": "Sheet Piling Of Iron Or Steel, Whether Or Not Drilled,", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73041110", "description": "Tubes, Pipes And Hollow Profiles, Seamless", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73041900", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73049000", "description": "Tubes, Pipes And Hollow Profiles, Seamless, Of Iron (Other Than Cast Iron) Or Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "730520", "description": "Casing Of A Kind Used In Drilling For Oil Or Gas", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73052000", "description": "Casing Of A Kind Used In Drilling For Oil Or Gas", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73060000", "description": "Other Tubes, Pipes And Hollow Profiles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73061100", "description": "Other Tubes, Pipes And Hollow Profiles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73063090", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73064000", "description": "Other Tubes, Pipes And Hollow Profiles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73069019", "description": "Other Tubes, Pipes And Hollow Profiles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73069090", "description": "Other Tubes, Pipes And Hollow Profiles (For Example", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73070000", "description": "Tube Or Pipe Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73071110", "description": "Tube Or Pipe Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73071120", "description": "Tube Or Pipe Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73071190", "description": "tube or pipe fittings of iron or steel,", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "73072000", "description": "tube or pipe fittings of iron or steel", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "73072300", "description": "Other Bars And Rods Of Iron Or Non-Alloy Steel", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "73072900", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73079190", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73079210", "description": "Threaded Elbows, Bends And Sleeves : Galvanised", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73079910", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73079990", "description": "Tube Or Pipe Fittings,Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73080000", "description": "Structures (Excluding Prefabricated Buildings Of Heading 9406)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73081000", "description": "Structures (Excluding Prefabricated Buildings Of Heading 9406)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73082019", "description": "Structures (Excluding Prefabricated Buildings Of Heading 9406)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73083000", "description": "Structures (Excluding Prefabricated Buildings Of Heading 9406)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73089090", "description": "Structures (Excluding Prefabricated Buildings Of Heading 9406)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73130020", "description": "Barbed Wire Of Iron Or Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73141400", "description": "Other Woven Cloth, Of Stainless Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73141910", "description": "Cloth (Including Endless Bands)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73143900", "description": "Cloth (Including Endless Bands), Grill, Netting And Fencing", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73145000", "description": "Expanded metal", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "73151210", "description": "Lifting And Hoisting Chain", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73158900", "description": "Chain And Parts Thereof, Of Iron Or Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73170000", "description": "Nails, Tacks, Drawing Pins, Corrugated Nails", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73170011", "description": "Nails, Tacks, Drawing Pins", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73180000", "description": "Screws, Bolts, Nuts, Coach-Screws, Screw Hooks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73181110", "description": "Screws, Bolts, Nuts, Coach-Screws, Screw Hooks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73181200", "description": "Screws, Bolts, Nuts, Coach-Screws, Screw Hooks, Rivets, Cotters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73181400", "description": "Screws, Bolts, Nuts, Coach-Screws, Screw Hooks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73181500", "description": "Screws, Bolts, Nuts, Coach-Screws, Screw Hooks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73181600", "description": "Screws, Bolts, Nuts, Coach-Screws, Screw Hooks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73181900", "description": "Screws, Bolts, Nuts, Coach-Screws, Screw Hooks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73182100", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73182200", "description": "Screws, Bolts, Nuts, Coach-Screws, Screw Hooks, Rivets, Cotters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73182400", "description": "Screws, Bolts, Nuts, Coach-Screws, Screw Hooks, Rivets", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73182900", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73182990", "description": "Screws, Bolts, Nuts, Coach-Screws, Screw Hooks, Rivets, Cotters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73199000", "description": "Sewing Needles, Knitting Needles, Bodkins", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73209090", "description": "Springs And Leaves For Springs", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73219000", "description": "Stoves, Ranges, Grates", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73231000", "description": "Steel Scrub", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "732393", "description": "Of Stainless Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73239300", "description": "Stainless Steel", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "73239310", "description": "Table, Kitchen Or Other Household Articles And Parts Thereof", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "73240000", "description": "sanitary ware", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "73251000", "description": "Other Cast Articles Of Iron Or Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "732599", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73259910", "description": "Other Cast Articles Of Iron Or Steel - Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73259920", "description": "Other Cast Articles Of Iron Or Steel - Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73259930", "description": "Other Cast Articles Of Iron Or Steel - Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73259999", "description": "Other Cast Articles Of Iron Or Steel - Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73260000", "description": "Other Articles Of Iron Or Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73261100", "description": "Grinding Balls And Similar Articles For Mills", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73261900", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73261990", "description": "Other Articles Of Iron Or Steel - Forged Or Stamped", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73269000", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73269099", "description": "Other Articles Of Iron Or Stee", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "73939390", "description": "", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "74040011", "description": "Copper Waste And Scrap", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "74040019", "description": "Copper Waste And Scrap", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "74040022", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "74071020", "description": "Copper and articles thereof", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "74091900", "description": "Copper Plates, Sheets and Strip", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "74111000", "description": "Copper Tubes And Pipes - Of Refined Copper", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "74120000", "description": "Copper Tube or Pipe Fittings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "74122090", "description": "Fittings of bronze or other alloys of copper", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "74130000", "description": "Stranded Wire, Cables, Plated Bands and the Like", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "74150000", "description": "Nails, Tacks, Drawing Pins, Staples", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "74151000", "description": "Ails, Tacks, Drawing Pins, Staples", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "74153390", "description": "Nails, Tacks, Drawing Pins", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "76020010", "description": "Aluminium Waste And Scrap - Aluminium", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "76020090", "description": "Aluminium Waste And Scrap - Aluminium", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "76042910", "description": "Aluminium bars", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "76042930", "description": "Aluminium Bars, Rods And Profiles - Of Aluminium Alloys", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "76042990", "description": "Aluminum Bars, Rods, and Profiles made from Aluminum Alloys", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "76060000", "description": "Aluminium Plates, Sheets And Strip, Of A Thickness Exceeding 0.2 Mm", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "76061190", "description": "Of aluminium, not alloyed: Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "76061200", "description": "Aluminium Alloys", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "76071999", "description": "Aluminium Foil", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "76109030", "description": "Aluminium Structures", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "76160000", "description": "Other Articles Of Aluminium", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "76169990", "description": "Other Articles Of Aluminium - Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "78060010", "description": "Other Articles Of Lead - Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "79020010", "description": "Zinc Waste And Scrap", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "81019400", "description": "Tungsten (Wolfram) And Articles Thereof", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82020000", "description": "Hand Saws; Blades For Saws Of All Kinds", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82029120", "description": "Hand Saws; Blades For Saws Of All Kinds", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82029910", "description": "Hand Saws; Blades For Saws Of All Kinds", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82030000", "description": "Files, Rasps, Pliers (Including Cutting Pliers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82032000", "description": "Files, Rasps, Pliers (Including Cutting Pliers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82033000", "description": "Files, Rasps, Pliers (Including Cutting Pliers)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82040000", "description": "Hand-Operated Spanners And Wrenches", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82041110", "description": "Hand-Operated Spanners And Wrenches", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "82041220", "description": "Hand-Operated Spanners And Wrenches", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82042000", "description": "Hand-Operated Spanners And Wrenches", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82050000", "description": "Hand Tools (Including Glaziers Diamonds)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82052000", "description": "Hand Tools", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "82054000", "description": "Hand tools (including glaziers' diamonds)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82055930", "description": "Hand Tools (Including Glaziers Diamonds), Not Elsewhere Specified", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82055990", "description": "Hand Tools (Including Glaziers Diamonds)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82057000", "description": "Hand Tools (Including Glaziers Diamonds)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82070000", "description": "Interchangeable Tools For Hand Tools", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82071300", "description": "Interchangeable Tools For Hand Tools", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82075000", "description": "Interchangeable Tools For Hand Tools", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "82078000", "description": "Interchangeable Tools For Hand Tools", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82080000", "description": "Knives And Cutting Blades, For Machines", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82089090", "description": "Knives And Cutting Blades", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82119400", "description": "Knives With Cutting Blades", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "82140000", "description": "Other Articles Of Cutlery", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "83010000", "description": "Padlocks And Locks (Key, Combination Or Electrically Operated)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "83011000", "description": "Padlocks And Locks (Key, Combination Or Electrically Operated)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "83020000", "description": "Base Metal Mountings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "83021000", "description": "Hinges", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "83022000", "description": "Fork-Lift Trucks Wheels", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "83030000", "description": "Armoured Or Reinforced Safes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "83052000", "description": "Corners, Paper Clips, Indexing Tags And Similar Office Articles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "83071000", "description": "Flexible Tubing Of Base Metal", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "83110000", "description": "Wire, Rods, Tubes, Plates, Electrodes And Similar Products", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "83111000", "description": "Wire, Rods, Tubes, Plates, Electrodes And Similar Products", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "83113090", "description": "Wire, Rods, Tubes, Plates, Electrodes And Similar Products", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84011000", "description": "Nuclear Reactors; Fuel Elements (Cartridges)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84029090", "description": "Steam Or Other Vapour Generating Boilers", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84090000", "description": "Parts Suitable For Use Solely", "igst": 28.0, "cgst": 14.0, "sgst": 14.0}, {"code": "84099191", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84099949", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84099990", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84100000", "description": "Hydraulic Turbines, Water Wheels", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84121000", "description": "Other Engines And Motors Reaction Engines Other Than Turbo Jets", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84122990", "description": "Other Engines And Motors Hydraulic Power Engines", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84123100", "description": "Other Engines And Motors - Pneumatic Power Engines", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84129090", "description": "Other Engines And Motors Parts: Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84130000", "description": "Pumps For Liquids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84131990", "description": "Designed To Be Fitted With A Measuring Device: Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84133030", "description": "Pumps For Liquids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84135021", "description": "Pumps For Liquids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84135029", "description": "Pumps For Liquids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84135090", "description": "Pumps For Liquids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "841370", "description": "Other Centrifugal Pumps", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84137000", "description": "Other Centrifugal Pumps", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84137010", "description": "Pumps For Liquids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84137091", "description": "Pumps For Liquids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84137092", "description": "Pumps For Liquids,", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84138130", "description": "Pumps For Liquids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84138190", "description": "Pumps For Liquids, Whether", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84139100", "description": "Of Pumps", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84139120", "description": "Pumps For Liquids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84139130", "description": "Pumps For Liquids, Whether Or Not Fitted With A Measuring Device", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84139190", "description": "Pumps For Liquids", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84139210", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84140000", "description": "Air Or Vacuum Pumps", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84145100", "description": "Table, Floor, Wall, Window", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84145110", "description": "Air Or Vacuum Pumps, Air Or Other Gas Compressors And Fans", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84145120", "description": "Air Or Vacuum Pumps", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84145190", "description": "Air Or Vacuum Pumps, Air Or Other Gas Compressors And Fans;", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84145910", "description": "Air Or Vacuum Pumps", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84145930", "description": "Air Or Vacuum Pump", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "841490", "description": "Parts", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84149019", "description": "Air Or Vacuum Pumps", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84149030", "description": "Air Or Vacuum Pumps, Air Or Other Gas Compressors And Fans", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84149090", "description": "Air Or Vacuum Pumps", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84150000", "description": "Air Conditioning Machines", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84151010", "description": "Air Conditioning Machines", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84160000", "description": "Furnace Burners For Liquid Fuel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84169000", "description": "Furnace Burners For Liquid Fuel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84176050", "description": "Automatic Data Processing Machines And Units Thereof", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84195010", "description": "Machinery, Plant Or Laboratory Equipment", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84195090", "description": "Machinery, Plant Or Laboratory Equipment", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84195099", "description": "Machinery, Plant Or Laboratory Equipment", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84198990", "description": "laboratory equipment", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84199090", "description": "Machinery, Plant Or Laboratory Equipment", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84210000", "description": "Centrifuges, Including Centrifugal Dryers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84212110", "description": "Control Panels", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84212190", "description": "Centrifuges, Including Centrifugal Dryers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84212200", "description": "Centrifuges, Including Centrifugal Dryers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84212300", "description": "Centrifuges, Including Centrifugal Dryers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84212900", "description": "Centrifuges, Including Centrifugal Dryers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84213100", "description": "Centrifuges, Including Centrifugal Dryers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84213990", "description": "Centrifuges, Including Centrifugal Dryers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84219900", "description": "Centrifuges, Including Centrifugal Dryers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84238200", "description": "Having A Maximum Weighing Capacity Exceeding 30 Kg", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84239010", "description": "Parts Of Weighing Machinery", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84239020", "description": "Weighing Machine Weights Of All Kinds; Parts Of Weighing Machinery: Parts", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84240000", "description": "Mechanical Appliances", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84241000", "description": "Mechanical Appliances (Whether Or Not Handoperated) For Projecting", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84242000", "description": "Mechanical Appliances", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84248000", "description": "Mechanical Appliances", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84248910", "description": "Mechanical Appliances", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84249000", "description": "Mechanical Appliances", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84249080", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84251110", "description": "Pulley tackle and hoists other than skip hoists; winches and capstans.", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84254900", "description": "Pulley Tackle And Hoists Other Than Skip Hoists;", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84260000", "description": "Ships Derricks; Cranes Including Cable Cranes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84279000", "description": "8427 Fork-Lift Trucks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "8431000", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84310000", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84311010", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84311090", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84312010", "description": "Of Machinery Of Heading 8427 :Of Fork Lift Trucks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84313910", "description": "Parts Suitable For Use Solely Or Principally With The Machinery", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84314100", "description": "Of Machinery Of Heading 8426, 8429 Or 8430 :Buckets, Shovels, Grabs And Grips", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84314920", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84314990", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84321090", "description": "Sportsground Rollers 8432 10 - Ploughs: Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84329010", "description": "90 Agricultural", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84331110", "description": "Harvesting Or Threshing Machinery, Including Straw", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84334000", "description": "Harvesting Or Threshing Machinery", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84336010", "description": "60 Harvesting Or Threshing Machinery", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84339000", "description": "60 Harvesting Or Threshing Machinery, Including Straw", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84369100", "description": "Other Agricultural, Horticultural, Forestry, Poultry-Keeping", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84371000", "description": "Machines For Cleaning, Sorting Or Grading Seed", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84381010", "description": "Machinery, Not Specified Or Included Elsewhere In This Chapter,", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84419000", "description": "Spares for Cutting Machines", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84430000", "description": "Printing Machinery Used For Printing By Means Of Plates", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84433900", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84439959", "description": "Printing Machinery Used For Printing By Means Of Plates", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84439990", "description": "Printing Machinery Used For Printing By Means Of Plates", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84451110", "description": "Machines For Preparing Textile Fibres", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84451190", "description": "Machines For Preparing Textile Fibres; Spinning,", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84481110", "description": "Auxiliary Machinery For Use With Machines Of Heading 8444, 8445, 8446", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84481900", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84482000", "description": "Suitable For Use Solely Or Principally With The Machines Of This He", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84483210", "description": "Auxiliary Machinery For Use With Machines Of Heading 8444, 8445, 8446", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84483310", "description": "Auxiliary Machinery For Use With Machines Of Heading 8444, 8445, 8446", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84483990", "description": "Auxiliary Machinery For Use With Machines Of Heading 8444, 8445, 8446 Or 8447", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84511010", "description": "Machinery (Other Than Machines Of Heading 8450) For Washing", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84512100", "description": "Machinery (Other Than Machines Of Heading 8450) For Washing,", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84539090", "description": "Machinery For Preparing, Tanning Or Working Hides", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84543010", "description": "Converters, Ladles, Ingot Moulds And Casting Machines", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84560000", "description": "Machine-Tools For Working Any Material By Removal Of Material", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84571020", "description": "Machining Centres, Unit Construction Machines", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84590000", "description": "Machine-Tools (Including Way-Type Unit Head Machines) For Drilling", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84594010", "description": "Machine-Tools (Including Way-Type Unit Head Machines) For Drilling", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84612011", "description": "Machine-Tools For Planing, Shaping, Slotting, Broaching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84615021", "description": "Machine-Tools For Planing, Shaping, Slotting, Broaching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84651000", "description": "Machine Tools (Including Machines For Nailing, Stapling", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84659910", "description": "Machine Tools (Including Machines For Nailing, Stapling", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84661010", "description": "Parts And Accessories Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84669310", "description": "Parts And Accessories Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84670000", "description": "Tools For Working In The Hand, Pneumatic", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84671110", "description": "Tools For Working In The Hand, Pneumatic", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84671900", "description": "Machine", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84672100", "description": "Tools For Working In The Hand, Pneumatic", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84672900", "description": "Tools For Working In The Hand, Pneumatic", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84701000", "description": "Incorporating A Calculating Device; Cash Reg", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84710000", "description": "Automatic Data Processing Machines And Units Thereof", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84713010", "description": "Automatic Data Processing Machines And Units", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84715000", "description": "Automatic Data Processing Machines And Units Thereof", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84716060", "description": "Automatic Data Processing Machines And Units Thereof", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84716090", "description": "Classification of wireless kit", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84718000", "description": "Automatic Data Processing Machines And Units Thereof", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84721000", "description": "Perforating Or Stapling Machines) Du", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84729099", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84730000", "description": "Parts And Accessories (Other Than Covers", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84733099", "description": "Parts And Accessories (Other Than Covers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84742010", "description": "Machinery For Sorting, Screening, Separating", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84771000", "description": "Machinery For Working Rubber", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84798100", "description": "Machines And Mechanical Appliances Having Individual Functions", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84798999", "description": "Machines And Mechanical Appliances Having Individual Functions", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84803000", "description": "", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84810000", "description": "Taps, Cocks, Valves And Similar Appliances For Pipes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84811000", "description": "Taps, Cocks, Valves And Similar Appliances For Pipes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84812000", "description": "Taps, Cocks, Valves And Similar Appliances For Pipes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84813000", "description": "Taps, Cocks, Valves And Similar Appliances For Pipes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84818000", "description": "Other Appliances", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84818020", "description": "Taps, Cocks, Valves And Similar Appliances For Pipes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84818030", "description": "Taps, Cocks, Valves And Similar Appliances For Pipes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84818050", "description": "Taps, Cocks, Valves And Similar Appliances For Pipes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84818090", "description": "Taps, Cocks, Valves And Similar Appliances For Pipes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84819000", "description": "Parts", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84819090", "description": "Taps, Cocks, Valves And Similar Appliances For Pipes", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84820000", "description": "Ball Or Roller Bearings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84821011", "description": "Ball Or Roller Bearings - Ball Bearings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84821090", "description": "machinery and mechanical appliances", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84822090", "description": "Ball Or Roller Bearings - Ball Bearings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84823000", "description": "Ball Or Roller Bearings Spherical Roller Bearings", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84829900", "description": "Ball Or Roller Bearings - Parts Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84830000", "description": "Transmission Shafts (Including Cam Shafts And Crank Shafts)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84831010", "description": "Transmission Shafts (Including Cam Shafts And Crank Shafts) And Crank", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84832000", "description": "Transmission Shafts (Including Cam Shafts And Crank Shafts)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84833000", "description": "Transmission Shafts (Including Cam Shafts And Crank Shafts) And Cranks;", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84834000", "description": "Transmission Shafts (Including Cam Shafts And Crank Shafts) And Cranks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84836010", "description": "Transmission Shafts (Including Cam Shafts And Crank Shafts)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84839000", "description": "Transmission Shafts (Including Cam Shafts And Crank Shafts)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84840000", "description": "Gaskets And Similar Joints Of Metal Sheeting", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84841000", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84842000", "description": "Gaskets And Similar Joints Of Metal Sheeting", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84861000", "description": "Machines And Apparutus Of A Kind Used Solely", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "84870000", "description": "Machines Parts, Not Containing Electrical Connectors,", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "84879000", "description": "Machinery Parts, Not Containing Electrical", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85010000", "description": "Electric Motors And Generators (Excluding Generating Sets)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85011020", "description": "Electric Motors And Generators (Excluding Generating Sets) Motors", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85014010", "description": "Electric Motors And Generators (Excluding Generating Sets)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85015210", "description": "Electric Motors And Generators (Excluding Generating Sets)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85015310", "description": "Electric Motors And Generators (Excluding Generating Sets)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85030000", "description": "Parts Suitable For Use Solely Or Principally With The Machines Of Heading 8501 Or 8502", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85030010", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85030021", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85030090", "description": "Electrical machinery and equipment and parts", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85040000", "description": "Electrical Transformers, Static Converters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85041020", "description": "8504 Electrical Transformers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85043300", "description": "Electrical machinery and equipment and parts thereof", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85044010", "description": "Electrical Transformers, Static Converters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85044090", "description": "Electrical Transformers, Static Converters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85045090", "description": "Electrical Transformers, Static Converters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85049090", "description": "Electrical Transformers, Static Converters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85050000", "description": "Electro-Magnets; Permanent Magnets", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85051110", "description": "Electro-Magnets", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85059000", "description": "Electro-Magnets; Permanent Magnets", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85060000", "description": "Primary Cells And Primary Batteries", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85068090", "description": "Primary Cells And Primary Batteries - Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85070000", "description": "Electric Accumulators, Including Separators Therefor", "igst": 28.0, "cgst": 14.0, "sgst": 14.0}, {"code": "85071000", "description": "Electric Accumulators, Including Separators Therefor", "igst": 28.0, "cgst": 14.0, "sgst": 14.0}, {"code": "85072000", "description": "Electric Accumulators, Including Separators Therefor,", "igst": 28.0, "cgst": 14.0, "sgst": 14.0}, {"code": "85111000", "description": "Electrical Ignition Or Starting Equipment Of A Kind Used For Spark", "igst": 28.0, "cgst": 14.0, "sgst": 14.0}, {"code": "85122010", "description": "Electrical Lighting Or Signalling Equipment (Excluding Articles Of Heading 8539)Electrical Lighting Or Signalling Equipment (Excluding Articles Of Heading 8539)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85124000", "description": "Electrical Lighting Or Signalling Equipment", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85131010", "description": "Torch", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85149030", "description": "Electric Fans", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85150000", "description": "Electric (Including Electrically Heated Gas)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85151100", "description": "Electric (Including Electrically Heated Gas)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85159000", "description": "Electric (Including Electrically Heated Gas)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85161000", "description": "Electric Instantaneous", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85169000", "description": "Electric Instantaneous Or Storage Water Heaters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85171190", "description": "Telephone Sets, Including Telephones For Cellular Networks Or For Other Wireless Networks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85176200", "description": "Machines For The Reception", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85176290", "description": "HS Codes Classification of Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85235100", "description": "USB drives,", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85258090", "description": "Transmission apparatus for radio broadcasting", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85285200", "description": "Capable Of Directly Connecting To And Designed", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85310000", "description": "Electric Sound Or Visual Signalling Apparatus", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85319000", "description": "Electric Sound Or Visual Signalling Apparatus", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85320000", "description": "Electrical Capacitors, Fixed, Variable Or Adjustable (Pre-Set)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85321000", "description": "Electrical Capacitors, Fixed", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85322500", "description": "Electrical Capacitors, Fixed, Variable Or Adjustable (Pre-Set)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85340000", "description": "Printed Circuits", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85350000", "description": "Electrical Apparatus For Switching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85359090", "description": "Electrical Apparatus For Switching", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85360000", "description": "Electrical Apparatus For Switching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85361000", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85361010", "description": "Electrical Apparatus For Switching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85361040", "description": "Electrical Apparatus For Switching Or Protecting Electrical Circuits", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85361060", "description": "Electrical Apparatus For Switching", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85361090", "description": "Electrical Apparatus For Switching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85362000", "description": "Electrical Apparatus For Switching Or Protecting Electrical Circuits", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85362030", "description": "Electrical Apparatus For Switching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85364100", "description": "Electrical Apparatus For Switching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85364900", "description": "Electrical Apparatus For Switching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85365010", "description": "Electrical Apparatus For Switching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85365020", "description": "Electrical Apparatus For Switching Or Protecting Electrical Circuits", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85365090", "description": "Electrical Apparatus For Switching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85366110", "description": "Electrical Apparatus For Switching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85366910", "description": "Electrical Apparatus For Switching Or Protecting Electrical Circuits", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85369010", "description": "Electrical Apparatus For Switching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85369090", "description": "Electrical Apparatus For Switching", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85370000", "description": "Boards, Panels, Consoles, Desks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85371000", "description": "Boards, Panels, Consoles, Desks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85380000", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85381010", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85381090", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85389000", "description": "Parts Suitable For Use Solely", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85390000", "description": "Electric Filament Or Discharge Lamps", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "85391010", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85392910", "description": "Light-Emitting Diode (Led) Lamps", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85394900", "description": "UV purifier lamps", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85395000", "description": "Light-Emitting Diode (Led) Lamps", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85410000", "description": "Diodes, transistors and similar semi-conductor devices", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85411000", "description": "Diodes, Transistors And Similar Semi-Conductor Devices", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85414011", "description": "Diodes, Transistors And Similar Semi-Conductor Devices", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85433000", "description": "Electrical Machines And Apparatus Having Individual Functions", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85439000", "description": "Electrical Machines And Apparatus Having Individual Functions", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85440000", "description": "Insulated (Including Enamelled Or Anodised) Wire", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85441100", "description": "Insulated (Including Enamelled Or Anodised) Wire", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85441990", "description": "Insulated (Including Enamelled Or Anodised) Wire", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85442010", "description": "Insulated (Including Enamelled Or Anodised) Wire, Cable", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85444210", "description": "Parts Of Weighing Machinery", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85444220", "description": "Insulated (Including Enamelled Or Anodised) Wire", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85444299", "description": "Insulated (Including Enamelled Or Anodised) Wire", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85444992", "description": "Insulated (Including Enamelled Or Anodised) Wire", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85444999", "description": "Insulated (Including Enamelled Or Anodised) Wire", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85446000", "description": "Other Electric Conductors, For A Voltage Exceeding 1000 V", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85446020", "description": "Insulated (Including Enamelled Or Anodised) Wire", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85446090", "description": "Insulated (Including Enamelled Or Anodised) Wire", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85447000", "description": "optical fibre cables made up of individually sheathed fibres", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "85452000", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85459000", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85459090", "description": "Carbon Electrodes, Carbon Brushes, Lamp Carbons", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85460000", "description": "Electrical Insulators Of Any Material", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85469000", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85469090", "description": "Electrical Insulators Of Any Material Other : Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85481010", "description": "Waste And Scrap Of Primary Cells", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "85481090", "description": "Waste And Scrap Of Primary Cells", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "87012010", "description": "Tractors (Other Than Tractors Of Heading 8709) Road Tractors", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "870390", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "87081010", "description": "Parts And Accessories Of The Motor Vehicles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "87082900", "description": "Parts And Accessories Of The Motor Vehicles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "87083000", "description": "Parts And Accessories Of The Motor Vehicles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "87084000", "description": "Parts And Accessories Of The Motor Vehicles", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "87089200", "description": "Parts And Accessories Of The Motor Vehicles", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "87089900", "description": "Parts And Accessories Of The Motor Vehicles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "87141090", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "87149990", "description": "Parts And Accessories Of Vehicles Of Headings", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "90049010", "description": "Spectacles, Goggles And The Like, Corrective", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90049090", "description": "Goggles", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90100000", "description": "Volza's data of Iran", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90138010", "description": "Other Than Laser Diodes;", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90170000", "description": "Drawing, Marking-Out Or Mathematical Calculating Instruments", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90181100", "description": "Instruments And Appliances Used In Medical, Surgical", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90200000", "description": "Other Breathing Appliances And Gas Masks", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90220400", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90221420", "description": "14 Apparatus Based On The Use Of X-Rays Or Of Alpha", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90230000", "description": "Instruments, Apparatus And Models", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90233020", "description": "", "igst": 5.0, "cgst": 2.5, "sgst": 2.5}, {"code": "90250000", "description": "Hydrometers And Similar Floating Instruments, Thermometers, Pyrometers, Barometers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90251920", "description": "Hydrometers And Similar Floating Instruments", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90251990", "description": "Hydrometers And Similar Floating Instruments", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90260000", "description": "Instruments And Apparatus For Measuring Or Checking The Flow", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90261010", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90262000", "description": "Instruments And Apparatus For Measuring Or Checking The Flow", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90270000", "description": "Instruments And Apparatus For Physical Or Chemical Analysis", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90271000", "description": "Instruments And Apparatus For Physical Or Chemical Analysis", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90275090", "description": "Instruments And Apparatus For Physical Or Chemical Analysis", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "90279090", "description": "Instruments And Apparatus For Physical Or Chemical Analysis", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90280000", "description": "Gas, Liquid Or Electricity Supply Or Production Meters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90282000", "description": "Gas, Liquid Or Electricity Supply Or Production Meters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90283010", "description": "Gas, Liquid Or Electricity Supply Or Production Meters", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90303300", "description": "Other, Without A Recording Device", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90303390", "description": "Oscilloscopes, Spectrum Analysers And Other Instruments", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90303910", "description": "Oscilloscopes, Spectrum Analysers And Other Instruments", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90303950", "description": "Oscilloscopes, Spectrum Analysers And Other Instruments", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90309000", "description": "Parts And Accessories", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90318000", "description": "Measuring Or Checking Instruments", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90320000", "description": "Automatic Regulating Or Controlling Instruments And Apparatus", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90321010", "description": "Automatic Regulating Or Controlling Instruments And Apparatus", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90322090", "description": "Automatic Regulating Or Controlling Instruments And Apparatus", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90328710", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90328990", "description": "Automatic Regulating Or Controlling Instruments", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "90329000", "description": "automatic regulating or controlling instruments and apparatus", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "90330000", "description": "Parts And Accessories", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "91070000", "description": "Time Switches With Clock Or Watch Movement", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "94031010", "description": "Metal Furniture Of A Kind Used In Offices: Of Steel", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "94032090", "description": "Other Furniture And Parts Thereof - Other Metal", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "94038900", "description": "Other Furniture And Parts Thereof - Furniture Of Other Materials", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "94039000", "description": "Other Furniture And Parts Thereof -Parts", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "94051010", "description": "Lamps And Lighting Fittings Including Searchlights", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "94051020", "description": "Lamps And Lighting Fittings Including Searchlights", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "94054090", "description": "Lamps And Lighting Fittings Including Searchlights", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "94054200", "description": "Tubelight", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "95061100", "description": "Articles And Equipment For General Physical Exercise", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "96030000", "description": "Brooms, Brushes (Including Brushes Constituting Parts Of Machines", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "96031000", "description": "Brooms, Brushes (Including Brushes Constituting Parts Of Machines, Appliances Or Vehicles),", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "96033010", "description": "Brooms, Brushes (Including Brushes Constituting Parts Of Machines", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "96033090", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "96034000", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "96034010", "description": "Brooms, Brushes (Including Brushes Constituting Parts Of Machines", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "96035000", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "96039000", "description": "Brooms, Brushes (Including Brushes Constituting Parts Of Machines", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "96060000", "description": "Buttons, Press-Fasteners, Snap-Fasteners And Press-Studs", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "96080000", "description": "Ball Point Pens", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "96081019", "description": "Other", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "96082000", "description": "Felt Tipped Pen", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "96091000", "description": "Pencils (Other Than Pencils Of Heading 9608 ), Crayons", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "96099020", "description": "Uniball Shalaku M5 Assorted Body Mechanical Pencil", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "96122000", "description": "Typewriter or similar ribbons", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "96170012", "description": "Vacuum Flasks And Other Vacuum Vessels", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "980100", "description": "All Items Of Machinery Including Prime Movers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "98010000", "description": "All Items Of Machinery Including Prime Movers", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "98020000", "description": "Laboratory Chemicals", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "995411", "description": "Services Involving Repair", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "995429", "description": "construction services involving repair", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "997134", "description": "Nil Provided that Director (Sports)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "997137", "description": "Nil Provided that Director (Sports)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998333", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998533", "description": "Nil Provided that Director (Sports)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998711", "description": "Nil Provided that Director (Sports)", "igst": 12.0, "cgst": 6.0, "sgst": 6.0}, {"code": "998732", "description": "Nil Provided that Director (Sports)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "999411", "description": "Sewerage and Sewage Treatment Services", "igst": 0, "cgst": 0, "sgst": 0}]
const SAC_MASTER = [{"code": "995457", "description": "Nil Provided that Director (Sports)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "995462", "description": "Water plumbing and drain laying services", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "995464", "description": "Gas fitting installation services", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "996333", "description": "Services provided in canteen and other similar establishments", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "996603", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "997133", "description": "Nil Provided that Director (Sports),", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "997145", "description": "Nil Provided that Director (Sports)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "997313", "description": "Leasing Or Rental Services Concerning Construction Machinery And Equipment With Or Without Operator", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "997314", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998221", "description": "Nil Provided that Director (Sports), Ministry of Youth Affairs and Sports certifies", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998311", "description": "Management Consulting And Management Services", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998314", "description": "Nil Provided that Director (Sports), Ministry of Youth Affairs and Sports", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998331", "description": "Other Professional, Technical And Business Services", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998346", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998349", "description": "Other Technical And Scientific Services N.E.C.", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998393", "description": "Scientific And Technical Consulting Services", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998513", "description": "Employment services including personnel search/", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998515", "description": "Nil Provided that Director (Sports)", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998596", "description": "Nil Provided that Director (Sports), Ministry of Youth Affairs and Sports certifies", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998713", "description": "Nil Provided that Director (Sports), Ministry of Youth Affairs", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998717", "description": "Maintenance And Repair Services Of Commercial And Industrial Machinery.", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998719", "description": "Maintenance and repair services of other machinery and equipment's", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998729", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998874", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "998898", "description": "Nil Provided that Director (Sports)", "igst": 0, "cgst": 0, "sgst": 0}, {"code": "998911", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "999490", "description": "Other environmental protection services n.e.c.", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}, {"code": "999799", "description": "", "igst": 18.0, "cgst": 9.0, "sgst": 9.0}]

// ── Sample Items ──────────────────────────────────────
// Items loaded from backend API

// ── BLANK item template with ALL fields ───────────────
const BLANK = {
  // Basic
  code:'', name:'', printName:'', group:'', cat:'Service',
  uom:'Kg', location:'', desc:'',
  stockMaintain:true, bomMaintain:false, billingItem:true,
  binType:'Bin', // Bin/Box/Tray/Trolley
  // Additional (AD1-AD9)
  ad1Colour:'', ad2Type:'', ad3Finish:'', ad4RalCode:'',
  ad5ProcessLeadTime:'', ad6CoatingSystem:'', ad7CoatingThickness:'',
  ad8Mask:'No', ad9PackingType:'',
  // Purchase
  purchaseRate:'', scrapRate:'', purchaseAllowancePct:'',
  maxPurchaseRate:'', purchaseLedger:'',
  // Sales
  sellingRate:'', itemCost:'', salesAllowancePct:'',
  minSellingRate:'', mrpRate:'',
  // Engineering
  drawingNo:'', revisionNo:'', revisionDate:'',
  batchExpiry:'', warrantyPeriod:'', itemPower:'',
  packSize:'', batchQty:'', inspectionReport:false,
  kanbanStockPolicy:'', rejectionAllowance:'', leadDays:'',
  netWeight:'', inwardOutwardAllowancePct:'', kanbanQty:'',
  issueAllowance:'', scrapAllowance:'', excessProductionPct:'',
  productionRmConsumptionPct:'',
  // Inventory
  inventoryCalculation:'FIFO', minimumStock:'', maximumStock:'',
  minimumOrderQty:'', rol:'', eoq:'', materialName:'',
  maximumOrderQty:'', rackName:'', binName:'', makeName:'',
  minRouteSheetQty:'', length:'', width:'', height:'',
  uomInventory:'Kg', volume:'',
  // Statutory
  hsnNo:'', igst:'', cgst:'', sgst:'',
  sacNo:'', sacIgst:'', sacCgst:'', sacSgst:'',
  // Extra
  inspectionRequired:false, includeInInventoryCost:true,
  // UOM Conversions (array)
  uomConversions: [],
  // Alternative Items (array)
  alternativeItems: [],
  // Customer Parts (array)
  customerParts: [],
  // Supplier Parts (array)
  supplierParts: [],
  // Division Locations (array)
  divisionLocations: [],
}

const TABS = [
  { id:'basic',     label:'Item Info'       },
  { id:'additional',label:'Additional (AD)' },
  { id:'purchase',  label:'Purchase'        },
  { id:'sales',     label:'Sales'           },
  { id:'engineering',label:'Engineering'   },
  { id:'inventory', label:'Inventory'       },
  { id:'statutory', label:'Statutory / GST' },
  { id:'uom',       label:'UOM Conversion'  },
  { id:'alternative',label:'Alternatives'  },
  { id:'custparts', label:'Customer Parts'  },
  { id:'suppparts', label:'Supplier Parts'  },
  { id:'extra',     label:'Extra / Division'},
]

const CAT_COLORS = {
  'Service':      {bg:'#EBF2F8',c:'#1A5276'},
  'Finished Good':{bg:'#EDE0EA',c:'#714B67'},
  'Raw Material': {bg:'#D4EDDA',c:'#155724'},
  'Consumable':   {bg:'#FFF3CD',c:'#856404'},
  'Asset/Spare':  {bg:'#F8D7DA',c:'#721C24'},
}

const FG = ({ label, req, children, span }) => (
  <div style={{ gridColumn: span ? `span ${span}` : 'span 1' }}>
    <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
      display:'block', marginBottom:4 }}>
      {label}{req && <span style={{ color:'var(--odoo-red)' }}> *</span>}
    </label>
    {children}
  </div>
)

const inp = { padding:'7px 10px', border:'1px solid var(--odoo-border)',
  borderRadius:5, fontSize:12, outline:'none', width:'100%',
  fontFamily:'DM Sans,sans-serif' }

const sel = { ...inp }

export default function ItemMaster() {
  const [items,    setItems]   = useState([])
  const [loading,  setLoading] = useState(true)
  const [saving,   setSaving]  = useState(false)
  const [showForm, setShowForm]= useState(false)
  const [editCode, setEditCode]= useState(null)
  const [form,     setForm]    = useState(BLANK)
  const [tab,      setTab]     = useState('basic')
  const [search,   setSearch]  = useState('')
  const [catFilter,setCat]     = useState('All')
  const [statusF,  setStatusF] = useState('active')
  // Master dropdowns from DB
  const [uomList,   setUomList]   = useState([])
  const [groupList, setGroupList] = useState([])
  const [typeList,  setTypeList]  = useState([])
  const [hsnList,   setHsnList]   = useState([])
  const [sacList,   setSacList]   = useState([])


  // ── Fetch items from backend ────────────────────────
  const fetchItems = async () => {
    try {
      setLoading(true)
      const res  = await fetch(`${BASE_URL}/items`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Map backend fields to frontend format
      const mapped = (data.data || []).map(i => ({
        ...i,
        cat:     i.category,
        group:   i.category,
        stdRate: i.stdCost || 0,
        gst:     18,
        status:  i.isActive ? 'active' : 'inactive',
      }))
      setItems(mapped)
    } catch(err) {
      toast.error('Failed to load items: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch master dropdowns ──────────────────────────
  const fetchMasters = async () => {
    try {
      const [uomRes, grpRes, typRes] = await Promise.all([
        fetch(`${BASE_URL}/mdm/uom`,        { headers: authHeaders() }),
        fetch(`${BASE_URL}/mdm/item-group`, { headers: authHeaders() }),
        fetch(`${BASE_URL}/mdm/item-type`,  { headers: authHeaders() }),
      ])
      const [uomData, grpData, typData] = await Promise.all([
        uomRes.json(), grpRes.json(), typRes.json()
      ])
      setUomList(  (uomData.data  || []).filter(u => u.active).map(u => u.code))
      setGroupList((grpData.data  || []).filter(g => g.active).map(g => g.name))
      setTypeList( (typData.data  || []).filter(t => t.active).map(t => t.name))
    } catch(err) {
      console.log('Masters load error:', err.message)
    }
  }

  useEffect(() => { fetchItems(); fetchMasters() }, [])


  // ── Load masters ────────────────────────────────────────
  useEffect(() => {
    // Set HSN/SAC from embedded master data
    setHsnList(HSN_MASTER.map(h => ({ code: String(h.code), desc: h.description, igst: h.igst, cgst: h.cgst, sgst: h.sgst })))
    setSacList(SAC_MASTER.map(s => ({ code: String(s.code), desc: s.description, igst: s.igst, cgst: s.cgst, sgst: s.sgst })))
    // Load UOM, Group, Type from backend
    fetchMasters()
    fetchItems()
  }, [])

  const F = f => ({
    value: form[f] ?? '',
    onChange: e => setForm(p => ({ ...p, [f]: e.target.value }))
  })
  const CHK = f => ({
    checked: !!form[f],
    onChange: e => setForm(p => ({ ...p, [f]: e.target.checked }))
  })

  // All categories = from typeList (DB) + any in items not in typeList
  const cats = ['All', ...new Set([
    ...typeList,
    'Raw Material', 'Finished Goods', 'Work In Progress',
    'Service Item', 'Consumable', 'Service',
    ...items.map(i => i.cat)
  ].filter(Boolean))]
  const filtered = items.filter(i =>
    (catFilter === 'All' || i.cat === catFilter) &&
    (statusF === 'all' || i.status === statusF) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) ||
     i.code.toLowerCase().includes(search.toLowerCase()))
  )

  const openNew  = () => { setForm(BLANK); setEditCode(null); setShowForm(true); setTab('basic') }
  const openEdit = item => { setForm({ ...BLANK, ...item }); setEditCode(item.code); setShowForm(true); setTab('basic') }

  const save = async () => {
    if (!form.code || !form.name) return toast.error('Item Code and Name required')
    setSaving(true)
    try {
      const payload = {
        code:        form.code,
        name:        form.name,
        category:    form.cat || form.group || 'Service',
        uom:         form.uom || 'Nos',
        hsnCode:     form.hsnNo || null,
        description: form.desc || null,
        stdCost:     form.stdRate  ? +form.stdRate  : null,
        mrp:         form.mrpRate  ? +form.mrpRate  : null,
        minStock:    form.minimumStock  ? +form.minimumStock  : null,
        reorderQty:  form.minimumOrderQty ? +form.minimumOrderQty : null,
      }
      let res, data
      if (editCode) {
        // find item id first
        const item = items.find(i => i.code === editCode)
        res  = await fetch(`${BASE_URL}/items/${item.id}`, {
          method: 'PATCH', headers: authHeaders(), body: JSON.stringify(payload)
        })
      } else {
        res  = await fetch(`${BASE_URL}/items`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(payload)
        })
      }
      data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(`Item ${form.code} ${editCode ? 'updated' : 'created'}!`)
      await fetchItems()
      setShowForm(false); setForm(BLANK); setEditCode(null)
    } catch(err) {
      toast.error('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async code => {
    const item = items.find(i => i.code === code)
    if (!item) return
    try {
      const res = await fetch(`${BASE_URL}/items/${item.id}`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ isActive: item.status !== 'active' })
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success('Item status updated!')
      await fetchItems()
    } catch(err) {
      toast.error('Error: ' + err.message)
    }
  }

  // Array field helpers
  const addRow  = (field, blank) => setForm(p => ({ ...p, [field]: [...(p[field]||[]), blank] }))
  const setRow  = (field, idx, key, val) => setForm(p => ({
    ...p, [field]: p[field].map((r, i) => i === idx ? { ...r, [key]: val } : r)
  }))
  const delRow  = (field, idx) => setForm(p => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }))


  // ── HSN selected → auto fill IGST/CGST/SGST ──────────
  const onHsnChange = (val) => {
    const found = hsnList.find(h => h.code === String(val))
    if (found && found.igst > 0) {
      setForm(p => ({ ...p, hsnNo: val, igst: found.igst, cgst: found.cgst, sgst: found.sgst }))
    } else {
      setForm(p => ({ ...p, hsnNo: val }))
    }
  }

  // ── SAC selected → auto fill IGST/CGST/SGST ──────────
  const onSacChange = (val) => {
    const found = sacList.find(s => s.code === String(val))
    if (found && found.igst > 0) {
      setForm(p => ({ ...p, sacNo: val, sacIgst: found.igst, sacCgst: found.cgst, sacSgst: found.sgst }))
    } else {
      setForm(p => ({ ...p, sacNo: val }))
    }
  }

  // ── IGST typed → auto divide CGST/SGST ────────────────
  const onIgstChange = (val) => {
    const igst = parseFloat(val) || 0
    setForm(p => ({ ...p, igst: val, cgst: +(igst/2).toFixed(2), sgst: +(igst/2).toFixed(2) }))
  }

  const onSacIgstChange = (val) => {
    const igst = parseFloat(val) || 0
    setForm(p => ({ ...p, sacIgst: val, sacCgst: +(igst/2).toFixed(2), sacSgst: +(igst/2).toFixed(2) }))
  }

  const grid = (cols = 4) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: '10px 16px',
  })

  // ── FULL FORM ─────────────────────────────────────────
  // ── LIST VIEW ─────────────────────────────────────────
  if (loading) return (
    <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
      ⏳ Loading items from database...
    </div>
  )

  if (showForm) return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          {editCode ? `Edit Item — ${editCode}` : 'New Item'}
          <small>Item Master · MDM</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-p" onClick={save} disabled={saving}>
            {saving ? '⏳ Saving...' : (editCode ? 'Update Item' : 'Create Item')}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:0, overflowX:'auto',
        borderBottom:'2px solid var(--odoo-border)', marginBottom:16,
        background:'#fff', borderRadius:'8px 8px 0 0',
        border:'1px solid var(--odoo-border)', borderBottomWidth:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'8px 16px', fontSize:11, fontWeight:600, cursor:'pointer',
              border:'none', background:'transparent', whiteSpace:'nowrap',
              borderBottom: tab===t.id ? '2px solid var(--odoo-purple)' : '2px solid transparent',
              color: tab===t.id ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
              marginBottom:-1 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background:'#fff', border:'1px solid var(--odoo-border)',
        borderRadius:'0 0 8px 8px', padding:20 }}>

        {/* ── BASIC INFO ── */}
        {tab === 'basic' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Item Information</div>
            <div style={grid(4)}>
              <FG label="Item Code" req><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} {...F('code')} placeholder="SV-PC-001" disabled={!!editCode}/></FG>
              <FG label="Item Name" req span={2}><input style={inp} {...F('name')} placeholder="Powder Coating — RAL 9005"/></FG>
              <FG label="Print Name"><input style={inp} {...F('printName')} placeholder="Short print name"/></FG>
              <FG label="Item Group"><select style={sel} {...F('group')}>
                {groupList.length > 0
                  ? groupList.map(g => <option key={g}>{g}</option>)
                  : ['Surface Treatment','Finished Goods','Raw Materials','Consumables','Spare Parts'].map(g => <option key={g}>{g}</option>)
                }
              </select></FG>
              <FG label="Category"><select style={sel} {...F('cat')}>
                {typeList.length > 0
                  ? typeList.map(t => <option key={t}>{t}</option>)
                  : ['Service','Finished Good','Raw Material','Consumable','Asset/Spare'].map(t => <option key={t}>{t}</option>)
                }
              </select></FG>
              <FG label="Stock UOM"><select style={sel} {...F('uom')}>
                {uomList.length > 0
                  ? uomList.map(u => <option key={u}>{u}</option>)
                  : ['Kg','Nos','Ltr','Mtr','Set','Roll','Box'].map(u => <option key={u}>{u}</option>)
                }
              </select></FG>
              <FG label="Location"><input style={inp} {...F('location')} placeholder="WH-01 / Store"/></FG>
              <FG label="Bin / Box / Tray / Trolley"><select style={sel} {...F('binType')}>
                <option>Bin</option><option>Box</option><option>Tray</option><option>Trolley</option>
              </select></FG>
              <FG label="Description" span={4}>
                <textarea style={{ ...inp, minHeight:60, resize:'vertical' }} {...F('desc')} placeholder="Item description..."/>
              </FG>
            </div>
            {/* Checkboxes */}
            <div style={{ display:'flex', gap:24, marginTop:14, padding:'12px 14px',
              background:'var(--odoo-bg)', borderRadius:6 }}>
              {[
                ['stockMaintain',  'Stock Maintain'],
                ['bomMaintain',    'BOM Maintain'],
                ['billingItem',    'Billing Item'],
              ].map(([f, l]) => (
                <label key={f} style={{ display:'flex', alignItems:'center', gap:8,
                  fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  <input type="checkbox" {...CHK(f)}
                    style={{ width:14, height:14, accentColor:'var(--odoo-purple)' }}/>
                  {l}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── ADDITIONAL AD1-AD9 ── */}
        {tab === 'additional' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Additional Item Information (Configurable)</div>
            <div style={{ padding:'8px 12px', background:'#E6F7F7', border:'1px solid #00A09D',
              borderRadius:6, marginBottom:14, fontSize:12, color:'#005A58' }}>
              AD fields are configurable per customer/industry. For surface treatment, these capture coating specifications.
            </div>
            <div style={grid(3)}>
              <FG label="AD1 — Colour"><input style={inp} {...F('ad1Colour')} placeholder="e.g. Black, White, Silver"/></FG>
              <FG label="AD2 — Type"><input style={inp} {...F('ad2Type')} placeholder="e.g. Powder, Liquid, E-Coat"/></FG>
              <FG label="AD3 — Finish"><input style={inp} {...F('ad3Finish')} placeholder="e.g. Matt, Gloss, Satin"/></FG>
              <FG label="AD4 — RAL Code"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} {...F('ad4RalCode')} placeholder="e.g. RAL 9005"/></FG>
              <FG label="AD5 — Process Lead Time"><input style={inp} {...F('ad5ProcessLeadTime')} placeholder="e.g. 2 days"/></FG>
              <FG label="AD6 — Coating System"><input style={inp} {...F('ad6CoatingSystem')} placeholder="e.g. Single Coat, Double Coat"/></FG>
              <FG label="AD7 — Coating Thickness"><input style={inp} {...F('ad7CoatingThickness')} placeholder="e.g. 60-80 micron"/></FG>
              <FG label="AD8 — Mask Required"><select style={sel} {...F('ad8Mask')}>
                <option>No</option><option>Yes — Full</option><option>Yes — Partial</option>
              </select></FG>
              <FG label="AD9 — Packing Type"><input style={inp} {...F('ad9PackingType')} placeholder="e.g. Carton, Pallet"/></FG>
            </div>
          </div>
        )}

        {/* ── PURCHASE ── */}
        {tab === 'purchase' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Customer Purchase Information</div>
            <div style={grid(3)}>
              <FG label="Purchase Rate (₹)"><input style={inp} type="number" {...F('purchaseRate')} placeholder="0.00"/></FG>
              <FG label="Scrap Rate (₹)"><input style={inp} type="number" {...F('scrapRate')} placeholder="0.00"/></FG>
              <FG label="Purchase Allowance (%)"><input style={inp} type="number" {...F('purchaseAllowancePct')} placeholder="0"/></FG>
              <FG label="Maximum Purchase Rate (₹)"><input style={inp} type="number" {...F('maxPurchaseRate')} placeholder="0.00"/></FG>
              <FG label="Purchase Ledger"><select style={sel} {...F('purchaseLedger')}>
                <option>Purchase Account</option><option>RM Purchase Account</option>
                <option>Service Purchase Account</option><option>Capital Purchase</option>
              </select></FG>
            </div>
          </div>
        )}

        {/* ── SALES ── */}
        {tab === 'sales' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Sale Information</div>
            <div style={grid(3)}>
              <FG label="Selling Rate (₹)"><input style={inp} type="number" {...F('sellingRate')} placeholder="0.00"/></FG>
              <FG label="Item Cost (₹)"><input style={inp} type="number" {...F('itemCost')} placeholder="0.00"/></FG>
              <FG label="Sales Allowance (%)"><input style={inp} type="number" {...F('salesAllowancePct')} placeholder="0"/></FG>
              <FG label="Minimum Selling Rate (₹)"><input style={inp} type="number" {...F('minSellingRate')} placeholder="0.00"/></FG>
              <FG label="MRP Rate (₹)"><input style={inp} type="number" {...F('mrpRate')} placeholder="0.00"/></FG>
            </div>
          </div>
        )}

        {/* ── ENGINEERING ── */}
        {tab === 'engineering' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Engineering Information</div>
            <div style={grid(4)}>
              <FG label="Drawing No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} {...F('drawingNo')}/></FG>
              <FG label="Revision No"><input style={inp} {...F('revisionNo')}/></FG>
              <FG label="Revision Date"><input style={inp} type="date" {...F('revisionDate')}/></FG>
              <FG label="Batch Expiry (days)"><input style={inp} type="number" {...F('batchExpiry')}/></FG>
              <FG label="Warranty Period"><input style={inp} {...F('warrantyPeriod')} placeholder="e.g. 12 months"/></FG>
              <FG label="Item Power"><input style={inp} {...F('itemPower')} placeholder="e.g. 230V 50Hz"/></FG>
              <FG label="Pack Size"><input style={inp} {...F('packSize')}/></FG>
              <FG label="Batch Qty"><input style={inp} type="number" {...F('batchQty')}/></FG>
              <FG label="Lead Days"><input style={inp} type="number" {...F('leadDays')}/></FG>
              <FG label="Net Weight (Kg)"><input style={inp} type="number" {...F('netWeight')}/></FG>
              <FG label="Kanban Qty"><input style={inp} type="number" {...F('kanbanQty')}/></FG>
              <FG label="Kanban Stock Policy"><select style={sel} {...F('kanbanStockPolicy')}>
                <option>None</option><option>Make to Order</option>
                <option>Make to Stock</option><option>Kanban Replenish</option>
              </select></FG>
              <FG label="Rejection Allowance (%)"><input style={inp} type="number" {...F('rejectionAllowance')}/></FG>
              <FG label="Inward/Outward Allow (%)"><input style={inp} type="number" {...F('inwardOutwardAllowancePct')}/></FG>
              <FG label="Issue Allowance (%)"><input style={inp} type="number" {...F('issueAllowance')}/></FG>
              <FG label="Scrap Allowance (%)"><input style={inp} type="number" {...F('scrapAllowance')}/></FG>
              <FG label="Excess Production % (+/-)"><input style={inp} type="number" {...F('excessProductionPct')}/></FG>
              <FG label="Prod RM Consumption (%)"><input style={inp} type="number" {...F('productionRmConsumptionPct')}/></FG>
              <FG label="Inspection Report Required">
                <select style={sel} value={form.inspectionReport?'Yes':'No'}
                  onChange={e=>setForm(p=>({...p,inspectionReport:e.target.value==='Yes'}))}>
                  <option>No</option><option>Yes</option>
                </select>
              </FG>
            </div>
          </div>
        )}

        {/* ── INVENTORY ── */}
        {tab === 'inventory' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Inventory Information</div>
            <div style={grid(4)}>
              <FG label="Inventory Calculation"><select style={sel} {...F('inventoryCalculation')}>
                <option>FIFO</option><option>LIFO</option><option>Weighted Average</option><option>Standard Cost</option>
              </select></FG>
              <FG label="Minimum Stock"><input style={inp} type="number" {...F('minimumStock')}/></FG>
              <FG label="Maximum Stock"><input style={inp} type="number" {...F('maximumStock')}/></FG>
              <FG label="Minimum Order Qty"><input style={inp} type="number" {...F('minimumOrderQty')}/></FG>
              <FG label="ROL (Reorder Level)"><input style={inp} type="number" {...F('rol')}/></FG>
              <FG label="EOQ"><input style={inp} type="number" {...F('eoq')}/></FG>
              <FG label="Maximum Order Qty"><input style={inp} type="number" {...F('maximumOrderQty')}/></FG>
              <FG label="Min Route Sheet Qty"><input style={inp} type="number" {...F('minRouteSheetQty')}/></FG>
              <FG label="Material Name"><input style={inp} {...F('materialName')}/></FG>
              <FG label="Rack Name"><input style={inp} {...F('rackName')}/></FG>
              <FG label="Bin Name"><input style={inp} {...F('binName')}/></FG>
              <FG label="Make Name"><input style={inp} {...F('makeName')}/></FG>
              <FG label="Length"><input style={inp} type="number" {...F('length')}/></FG>
              <FG label="Width"><input style={inp} type="number" {...F('width')}/></FG>
              <FG label="Height"><input style={inp} type="number" {...F('height')}/></FG>
              <FG label="Volume UOM"><select style={sel} {...F('uomInventory')}>
                <option>Kg</option><option>Nos</option><option>Ltr</option><option>Mtr</option><option>CBM</option>
              </select></FG>
            </div>
          </div>
        )}

        {/* ── STATUTORY ── */}
        {tab === 'statutory' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Statutory Information — GST</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              {/* Goods */}
              <div style={{ border:'1px solid var(--odoo-border)', borderRadius:6, padding:14 }}>
                <div style={{ fontWeight:700, fontSize:12, color:'#1A5276', marginBottom:10 }}>HSN (Goods)</div>
                <div style={grid(2)}>
                  <FG label="HSN No" span={2}>
                    <input
                      style={{ ...inp, fontFamily:'DM Mono,monospace' }}
                      value={form.hsnNo ?? ''}
                      onChange={e => onHsnChange(e.target.value)}
                      list="hsnDatalist"
                      placeholder="Type HSN code or description..."
                    />
                    <datalist id="hsnDatalist">
                      {hsnList.map(h => (
                        <option key={h.code} value={h.code}>{h.code} — {h.desc}</option>
                      ))}
                    </datalist>
                  </FG>
                  <FG label="IGST %">
                    <input style={inp} type="number"
                      value={form.igst ?? ''}
                      onChange={e => onIgstChange(e.target.value)}
                      placeholder="18"/>
                  </FG>
                  <FG label="CGST % (auto)">
                    <input style={{...inp, background:'#F8F7FA', color:'#6C757D'}}
                      type="number" value={form.cgst ?? ''} readOnly placeholder="9"/>
                  </FG>
                  <FG label="SGST % (auto)">
                    <input style={{...inp, background:'#F8F7FA', color:'#6C757D'}}
                      type="number" value={form.sgst ?? ''} readOnly placeholder="9"/>
                  </FG>
                </div>
              </div>
              {/* Services */}
              <div style={{ border:'1px solid var(--odoo-border)', borderRadius:6, padding:14 }}>
                <div style={{ fontWeight:700, fontSize:12, color:'#196F3D', marginBottom:10 }}>SAC (Services)</div>
                <div style={grid(2)}>
                  <FG label="SAC No" span={2}>
                    <input
                      style={{ ...inp, fontFamily:'DM Mono,monospace' }}
                      value={form.sacNo ?? ''}
                      onChange={e => onSacChange(e.target.value)}
                      list="sacDatalist"
                      placeholder="Type SAC code or description..."
                    />
                    <datalist id="sacDatalist">
                      {sacList.map(s => (
                        <option key={s.code} value={s.code}>{s.code} — {s.desc}</option>
                      ))}
                    </datalist>
                  </FG>
                  <FG label="IGST %">
                    <input style={inp} type="number"
                      value={form.sacIgst ?? ''}
                      onChange={e => onSacIgstChange(e.target.value)}
                      placeholder="18"/>
                  </FG>
                  <FG label="CGST % (auto)">
                    <input style={{...inp, background:'#F8F7FA', color:'#6C757D'}}
                      type="number" value={form.sacCgst ?? ''} readOnly placeholder="9"/>
                  </FG>
                  <FG label="SGST % (auto)">
                    <input style={{...inp, background:'#F8F7FA', color:'#6C757D'}}
                      type="number" value={form.sacSgst ?? ''} readOnly placeholder="9"/>
                  </FG>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── UOM CONVERSION ── */}
        {tab === 'uom' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="sd-stt" style={{ marginBottom:0 }}>UOM Conversion</div>
              <button onClick={() => addRow('uomConversions', { uomName:'', ratio:'', decimalPoint:'2', mrp:'', rate:'' })}
                style={{ padding:'5px 14px', fontSize:11, fontWeight:700, borderRadius:5,
                  border:'1px solid var(--odoo-purple)', background:'var(--odoo-purple-lt)',
                  color:'var(--odoo-purple)', cursor:'pointer' }}>
                + Add UOM
              </button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'var(--odoo-purple)' }}>
                  {['UOM Name','Conversion Ratio','Decimal Point','MRP','Rate',''].map(h => (
                    <th key={h} style={{ padding:'8px 10px', color:'#fff', textAlign:'left', fontSize:11, fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(form.uomConversions||[]).map((r, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--odoo-border)' }}>
                    <td style={{ padding:'6px 8px' }}><select style={{ ...sel, width:100 }} value={r.uomName} onChange={e=>setRow('uomConversions',i,'uomName',e.target.value)}>
                      <option>Kg</option><option>Nos</option><option>Ltr</option><option>Mtr</option><option>Set</option><option>Box</option>
                    </select></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, width:80 }} type="number" value={r.ratio} onChange={e=>setRow('uomConversions',i,'ratio',e.target.value)} placeholder="1.00"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, width:60 }} type="number" value={r.decimalPoint} onChange={e=>setRow('uomConversions',i,'decimalPoint',e.target.value)} placeholder="2"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, width:90 }} type="number" value={r.mrp} onChange={e=>setRow('uomConversions',i,'mrp',e.target.value)} placeholder="0.00"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, width:90 }} type="number" value={r.rate} onChange={e=>setRow('uomConversions',i,'rate',e.target.value)} placeholder="0.00"/></td>
                    <td style={{ padding:'6px 8px' }}><button onClick={() => delRow('uomConversions',i)} style={{ background:'none', border:'none', color:'var(--odoo-red)', cursor:'pointer', fontSize:16 }}>×</button></td>
                  </tr>
                ))}
                {!(form.uomConversions||[]).length && (
                  <tr><td colSpan={6} style={{ padding:20, textAlign:'center', color:'var(--odoo-gray)', fontSize:12 }}>No UOM conversions. Click + Add UOM.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── ALTERNATIVE ITEMS ── */}
        {tab === 'alternative' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="sd-stt" style={{ marginBottom:0 }}>Alternative Item Information</div>
              <button onClick={() => addRow('alternativeItems', { altItem:'', altCode:'', altName:'', action:'Allow' })}
                style={{ padding:'5px 14px', fontSize:11, fontWeight:700, borderRadius:5,
                  border:'1px solid var(--odoo-purple)', background:'var(--odoo-purple-lt)',
                  color:'var(--odoo-purple)', cursor:'pointer' }}>
                + Add Alternative
              </button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'var(--odoo-purple)' }}>
                  {['Alternative Item','Alt Item Code','Alt Item Name','Action',''].map(h => (
                    <th key={h} style={{ padding:'8px 10px', color:'#fff', textAlign:'left', fontSize:11, fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(form.alternativeItems||[]).map((r, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--odoo-border)' }}>
                    <td style={{ padding:'6px 8px' }}><input style={inp} value={r.altItem} onChange={e=>setRow('alternativeItems',i,'altItem',e.target.value)} placeholder="Alternative item"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.altCode} onChange={e=>setRow('alternativeItems',i,'altCode',e.target.value)} placeholder="ITEM-CODE"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={inp} value={r.altName} onChange={e=>setRow('alternativeItems',i,'altName',e.target.value)} placeholder="Item name"/></td>
                    <td style={{ padding:'6px 8px' }}><select style={{ ...sel, width:120 }} value={r.action} onChange={e=>setRow('alternativeItems',i,'action',e.target.value)}>
                      <option>Allow</option><option>Substitute</option><option>Replace</option>
                    </select></td>
                    <td style={{ padding:'6px 8px' }}><button onClick={() => delRow('alternativeItems',i)} style={{ background:'none', border:'none', color:'var(--odoo-red)', cursor:'pointer', fontSize:16 }}>×</button></td>
                  </tr>
                ))}
                {!(form.alternativeItems||[]).length && (
                  <tr><td colSpan={5} style={{ padding:20, textAlign:'center', color:'var(--odoo-gray)' }}>No alternatives added.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── CUSTOMER PARTS ── */}
        {tab === 'custparts' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="sd-stt" style={{ marginBottom:0 }}>Customer Part Information</div>
              <button onClick={() => addRow('customerParts', { customer:'', partNo:'', desc:'', hsnNo:'', igst:'', cgst:'', sgst:'', sacNo:'', sacIgst:'', sacCgst:'', sacSgst:'' })}
                style={{ padding:'5px 14px', fontSize:11, fontWeight:700, borderRadius:5,
                  border:'1px solid #1A5276', background:'#EBF2F8',
                  color:'#1A5276', cursor:'pointer' }}>
                + Add Customer Part
              </button>
            </div>
            {(form.customerParts||[]).map((r, i) => (
              <div key={i} style={{ border:'1px solid var(--odoo-border)', borderRadius:6,
                padding:14, marginBottom:10, background:'#F8F9FA' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontWeight:700, fontSize:12, color:'#1A5276' }}>Customer Part #{i+1}</span>
                  <button onClick={() => delRow('customerParts',i)} style={{ background:'none', border:'none', color:'var(--odoo-red)', cursor:'pointer', fontSize:14 }}>× Remove</button>
                </div>
                <div style={grid(4)}>
                  <FG label="Customer"><input style={inp} value={r.customer} onChange={e=>setRow('customerParts',i,'customer',e.target.value)} placeholder="Customer name"/></FG>
                  <FG label="Customer Part No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.partNo} onChange={e=>setRow('customerParts',i,'partNo',e.target.value)}/></FG>
                  <FG label="Customer Description" span={2}><input style={inp} value={r.desc} onChange={e=>setRow('customerParts',i,'desc',e.target.value)}/></FG>
                  <FG label="HSN No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.hsnNo} onChange={e=>setRow('customerParts',i,'hsnNo',e.target.value)}/></FG>
                  <FG label="IGST %"><input style={inp} type="number" value={r.igst} onChange={e=>setRow('customerParts',i,'igst',e.target.value)}/></FG>
                  <FG label="CGST %"><input style={inp} type="number" value={r.cgst} onChange={e=>setRow('customerParts',i,'cgst',e.target.value)}/></FG>
                  <FG label="SGST %"><input style={inp} type="number" value={r.sgst} onChange={e=>setRow('customerParts',i,'sgst',e.target.value)}/></FG>
                  <FG label="SAC No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.sacNo} onChange={e=>setRow('customerParts',i,'sacNo',e.target.value)}/></FG>
                  <FG label="SAC IGST %"><input style={inp} type="number" value={r.sacIgst} onChange={e=>setRow('customerParts',i,'sacIgst',e.target.value)}/></FG>
                  <FG label="SAC CGST %"><input style={inp} type="number" value={r.sacCgst} onChange={e=>setRow('customerParts',i,'sacCgst',e.target.value)}/></FG>
                  <FG label="SAC SGST %"><input style={inp} type="number" value={r.sacSgst} onChange={e=>setRow('customerParts',i,'sacSgst',e.target.value)}/></FG>
                </div>
              </div>
            ))}
            {!(form.customerParts||[]).length && (
              <div style={{ padding:24, textAlign:'center', color:'var(--odoo-gray)', fontSize:12, border:'1px dashed var(--odoo-border)', borderRadius:6 }}>
                No customer parts. Click + Add Customer Part.
              </div>
            )}
          </div>
        )}

        {/* ── SUPPLIER PARTS ── */}
        {tab === 'suppparts' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="sd-stt" style={{ marginBottom:0 }}>Supplier Part Information</div>
              <button onClick={() => addRow('supplierParts', { supplier:'', partNo:'', desc:'', hsnNo:'', igst:'', cgst:'', sgst:'', sacNo:'', sacIgst:'', sacCgst:'', sacSgst:'' })}
                style={{ padding:'5px 14px', fontSize:11, fontWeight:700, borderRadius:5,
                  border:'1px solid #196F3D', background:'#D4EDDA',
                  color:'#196F3D', cursor:'pointer' }}>
                + Add Supplier Part
              </button>
            </div>
            {(form.supplierParts||[]).map((r, i) => (
              <div key={i} style={{ border:'1px solid var(--odoo-border)', borderRadius:6,
                padding:14, marginBottom:10, background:'#F8F9FA' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontWeight:700, fontSize:12, color:'#196F3D' }}>Supplier Part #{i+1}</span>
                  <button onClick={() => delRow('supplierParts',i)} style={{ background:'none', border:'none', color:'var(--odoo-red)', cursor:'pointer', fontSize:14 }}>× Remove</button>
                </div>
                <div style={grid(4)}>
                  <FG label="Supplier"><input style={inp} value={r.supplier} onChange={e=>setRow('supplierParts',i,'supplier',e.target.value)} placeholder="Supplier name"/></FG>
                  <FG label="Supplier Part No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.partNo} onChange={e=>setRow('supplierParts',i,'partNo',e.target.value)}/></FG>
                  <FG label="Supplier Description" span={2}><input style={inp} value={r.desc} onChange={e=>setRow('supplierParts',i,'desc',e.target.value)}/></FG>
                  <FG label="HSN No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.hsnNo} onChange={e=>setRow('supplierParts',i,'hsnNo',e.target.value)}/></FG>
                  <FG label="IGST %"><input style={inp} type="number" value={r.igst} onChange={e=>setRow('supplierParts',i,'igst',e.target.value)}/></FG>
                  <FG label="CGST %"><input style={inp} type="number" value={r.cgst} onChange={e=>setRow('supplierParts',i,'cgst',e.target.value)}/></FG>
                  <FG label="SGST %"><input style={inp} type="number" value={r.sgst} onChange={e=>setRow('supplierParts',i,'sgst',e.target.value)}/></FG>
                  <FG label="SAC No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.sacNo} onChange={e=>setRow('supplierParts',i,'sacNo',e.target.value)}/></FG>
                  <FG label="SAC IGST %"><input style={inp} type="number" value={r.sacIgst} onChange={e=>setRow('supplierParts',i,'sacIgst',e.target.value)}/></FG>
                  <FG label="SAC CGST %"><input style={inp} type="number" value={r.sacCgst} onChange={e=>setRow('supplierParts',i,'sacCgst',e.target.value)}/></FG>
                  <FG label="SAC SGST %"><input style={inp} type="number" value={r.sacSgst} onChange={e=>setRow('supplierParts',i,'sacSgst',e.target.value)}/></FG>
                </div>
              </div>
            ))}
            {!(form.supplierParts||[]).length && (
              <div style={{ padding:24, textAlign:'center', color:'var(--odoo-gray)', fontSize:12, border:'1px dashed var(--odoo-border)', borderRadius:6 }}>
                No supplier parts. Click + Add Supplier Part.
              </div>
            )}
          </div>
        )}

        {/* ── EXTRA / DIVISION ── */}
        {tab === 'extra' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Extra Information</div>
            <div style={{ display:'flex', gap:24, padding:'12px 14px', background:'var(--odoo-bg)',
              borderRadius:6, marginBottom:16 }}>
              {[
                ['inspectionRequired',      'Inspection Required'],
                ['includeInInventoryCost',   'Include in Inventory Cost'],
              ].map(([f, l]) => (
                <label key={f} style={{ display:'flex', alignItems:'center', gap:8,
                  fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  <input type="checkbox" {...CHK(f)}
                    style={{ width:14, height:14, accentColor:'var(--odoo-purple)' }}/>
                  {l}
                </label>
              ))}
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="sd-stt" style={{ marginBottom:0 }}>Division-wise Location</div>
              <button onClick={() => addRow('divisionLocations', { division:'', rack:'', bin:'', minimumStock:'', rol:'' })}
                style={{ padding:'5px 14px', fontSize:11, fontWeight:700, borderRadius:5,
                  border:'1px solid var(--odoo-purple)', background:'var(--odoo-purple-lt)',
                  color:'var(--odoo-purple)', cursor:'pointer' }}>
                + Add Division
              </button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'var(--odoo-purple)' }}>
                  {['Division','Rack','Bin','Minimum Stock','ROL',''].map(h => (
                    <th key={h} style={{ padding:'8px 10px', color:'#fff', textAlign:'left', fontSize:11, fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(form.divisionLocations||[]).map((r, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--odoo-border)' }}>
                    <td style={{ padding:'6px 8px' }}><input style={inp} value={r.division} onChange={e=>setRow('divisionLocations',i,'division',e.target.value)} placeholder="Division name"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={inp} value={r.rack} onChange={e=>setRow('divisionLocations',i,'rack',e.target.value)} placeholder="Rack"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={inp} value={r.bin} onChange={e=>setRow('divisionLocations',i,'bin',e.target.value)} placeholder="Bin"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, width:80 }} type="number" value={r.minimumStock} onChange={e=>setRow('divisionLocations',i,'minimumStock',e.target.value)}/></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, width:80 }} type="number" value={r.rol} onChange={e=>setRow('divisionLocations',i,'rol',e.target.value)}/></td>
                    <td style={{ padding:'6px 8px' }}><button onClick={() => delRow('divisionLocations',i)} style={{ background:'none', border:'none', color:'var(--odoo-red)', cursor:'pointer', fontSize:16 }}>×</button></td>
                  </tr>
                ))}
                {!(form.divisionLocations||[]).length && (
                  <tr><td colSpan={6} style={{ padding:20, textAlign:'center', color:'var(--odoo-gray)' }}>No division locations. Click + Add Division.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom save */}
        <div style={{ display:'flex', gap:10, marginTop:20, paddingTop:14,
          borderTop:'1px solid var(--odoo-border)' }}>
          <button className="btn btn-p" onClick={save}>{editCode ? 'Update Item' : 'Create Item'}</button>
          <button className="btn btn-s" onClick={() => setShowForm(false)}>Cancel</button>
          <span style={{ fontSize:11, color:'var(--odoo-gray)', marginLeft:'auto', alignSelf:'center' }}>
            Tab: {TABS.find(t=>t.id===tab)?.label}
          </span>
        </div>
      </div>
    </div>
  )

  // ── LIST VIEW ─────────────────────────────────────────
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Item Master <small>MM60 · {filtered.length} items</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p" onClick={openNew}>+ New Item</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{ gridTemplateColumns:'repeat(5,1fr)', marginBottom:16 }}>
        {[
          { cls:'purple', l:'Total Items',    v:items.length },
          { cls:'green',  l:'Active',         v:items.filter(i=>i.status==='active').length },
          { cls:'blue',   l:'Services',       v:items.filter(i=>i.cat==='Service').length },
          { cls:'orange', l:'Raw Materials',  v:items.filter(i=>i.cat==='Raw Material').length },
          { cls:'red',    l:'Inactive',       v:items.filter(i=>i.status==='inactive').length },
        ].map(k => (
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <input placeholder="Search code or name..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ ...inp, width:260 }}/>
        <div style={{ display:'flex', gap:4 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                cursor:'pointer', border:'1px solid var(--odoo-border)',
                background: catFilter===c ? 'var(--odoo-purple)' : '#fff',
                color: catFilter===c ? '#fff' : 'var(--odoo-gray)' }}>
              {c}
            </button>
          ))}
        </div>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)}
          style={{ ...sel, width:120 }}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
      </div>

      <div style={{
        maxHeight: 'calc(100vh - 320px)',
        overflowY: 'auto',
        overflowX: 'auto',
        border: '1px solid var(--odoo-border)',
        borderRadius: 6,
      }}>
      <table className="fi-data-table" style={{ width:'100%', minWidth:900 }}>
        <thead style={{ position:'sticky', top:0, zIndex:10, background:'#F8F4F8' }}>
          <tr><th>Code</th><th>Item Name</th><th>Group</th><th>Cat</th><th>UOM</th><th>Std Rate</th><th>GST</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {filtered.map((item, i) => {
            const cc = CAT_COLORS[item.cat] || { bg:'#eee', c:'#555' }
            return (
              <tr key={item.code} style={{ background:i%2===0?'#fff':'#FAFAFA', opacity:item.status==='inactive'?.6:1 }}>
                <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-purple)', fontSize:12 }}>{item.code}</td>
                <td style={{ fontWeight:600 }}>{item.name}</td>
                <td style={{ fontSize:11 }}>{item.group||'—'}</td>
                <td><span style={{ padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:600, background:cc.bg, color:cc.c }}>{item.cat}</span></td>
                <td style={{ textAlign:'center', fontSize:11 }}>{item.uom}</td>
                <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:600, color:'var(--odoo-purple)' }}>
                  {item.stdRate ? '₹'+Number(item.stdRate).toLocaleString('en-IN') : '—'}
                </td>
                <td style={{ textAlign:'center', fontSize:11 }}>{item.gst}%</td>
                <td><span style={{ padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:600,
                  background:item.status==='active'?'#D4EDDA':'#F5F5F5',
                  color:item.status==='active'?'#155724':'#666' }}>
                  {item.status?.toUpperCase()}
                </span></td>
                <td style={{ display:'flex', gap:4 }}>
                  <button onClick={() => openEdit(item)}
                    style={{ padding:'3px 8px', fontSize:10, fontWeight:600, borderRadius:4,
                      border:'1px solid var(--odoo-purple)', background:'var(--odoo-purple-lt)',
                      color:'var(--odoo-purple)', cursor:'pointer' }}>Edit</button>
                  <button onClick={() => toggleStatus(item.code)}
                    style={{ padding:'3px 8px', fontSize:10, fontWeight:600, borderRadius:4,
                      border:'none', cursor:'pointer',
                      background:item.status==='active'?'#6C757D':'#00A09D', color:'#fff' }}>
                    {item.status==='active'?'Deactivate':'Activate'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
