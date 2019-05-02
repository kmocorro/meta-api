const { gql } = require('apollo-server-express');

let phones = [
    {
        id: 1,
        brand: 'Samsung',
        unit: 'A50',
        specs: {
            screenDesign: 'AMOLED U-Type',
            screenSize: '6.3x4',
            color: 'Black',
            batteryCap: 3500,
            processor: 'Exyon',
            frontCam: '25MP Single Camera',
            rearCam: 'Triple Camera 25MP Main | 8MP Wide | 5MP Depth',
        },
    }
]

const typeDefs = gql`

    type Phones {
        id: Int
        brand: String
        unit: String
    }

    type Query {
        phones: [Phones]
    }

    type Mutation {
        addPhone(id: Int, brand: String, unit: String): Phones
    }

    
`;

const resolvers = {
    Query: {
        phones: () => phones,
    },
};

exports.typeDefs = typeDefs;
exports.resolvers = resolvers;